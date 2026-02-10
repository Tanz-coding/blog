'use server'

import { GITHUB_CONFIG } from '@/consts'
import { revalidatePath } from 'next/cache'
import { decrypt } from '@/lib/aes256-util'

interface GuestbookMessage {
	id: string
	name: string
	content: string
	date: string
}

const GITHUB_API = 'https://api.github.com'
const MESSAGE_PATH = 'src/app/guestbook/messages.json'

// Check for Server-side Token
const getAuthToken = async () => {
	// Prefer strict env var first, fallback to process.env
	// Ensure you set GUESTBOOK_GH_TOKEN in .env.local
	const token = process.env.GUESTBOOK_GH_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN
	if (!token) return null

	try {
		// Attempt to decrypt the token using the project's encryption key
		return await decrypt(token, GITHUB_CONFIG.ENCRYPT_KEY)
	} catch (e) {
		// If decryption fails (e.g. it's a plain token), use it as is
		return token
	}
}

async function fetchFileSHA() {
	const token = await getAuthToken()
	if (!token) throw new Error('Missing GUESTBOOK_GH_TOKEN')

	const res = await fetch(`${GITHUB_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${MESSAGE_PATH}?ref=${GITHUB_CONFIG.BRANCH}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github.v3+json',
			'Cache-Control': 'no-cache'
		}
	})


	if (!res.ok) {
        if (res.status === 404) return null
        throw new Error(`GitHub API Error: ${res.statusText}`)
    }
	return await res.json()
}


// Helper to get Main Branch SHA
async function getMainBranchSHA(token: string) {
	const res = await fetch(`${GITHUB_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/git/ref/heads/${GITHUB_CONFIG.BRANCH}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	const data = await res.json()
	return data.object.sha
}

// Helper to create a new branch
async function createBranch(token: string, newBranchName: string, sha: string) {
	const res = await fetch(`${GITHUB_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/git/refs`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			ref: `refs/heads/${newBranchName}`,
			sha
		})
	})
	if (!res.ok) throw new Error(`Failed to create branch: ${res.statusText}`)
}

// Helper to create Pull Request
async function createPullRequest(token: string, head: string, title: string, body: string) {
	const res = await fetch(`${GITHUB_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/pulls`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			title,
			body,
			head,
			base: GITHUB_CONFIG.BRANCH
		})
	})
	if (!res.ok) throw new Error(`Failed to create PR: ${res.statusText}`)
	return await res.json()
}

export async function submitGuestbookMessage(formData: FormData) {
	const name = formData.get('name') as string
	const content = formData.get('content') as string

	if (!name || !content) {
		return { success: false, message: 'Name and content are required' }
	}

	const token = await getAuthToken()
	if (!token) {
		console.error('SERVER ERROR: GUESTBOOK_GH_TOKEN is missing')
		return { success: false, message: 'Server configuration error' }
	}

	try {
        // 1. Get current file (content & SHA)
		const fileData = await fetchFileSHA()
		let currentMessages: GuestbookMessage[] = []
        let sha = null

		if (fileData) {
            sha = fileData.sha
            // Decode Base64 content
			const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
			try {
				currentMessages = JSON.parse(decodedContent)
			} catch (e) {
				console.error('JSON Parse Error', e)
                currentMessages = []
			}
		}

        // 2. Prepare new data
		const newMessage: GuestbookMessage = {
			id: Date.now().toString(),
			name: name.trim(),
			content: content.trim(),
			date: new Date().toISOString().split('T')[0]
		}
		const updatedMessages = [newMessage, ...currentMessages]
        const newContentBase64 = Buffer.from(JSON.stringify(updatedMessages, null, 2)).toString('base64')

        // 3. Create a unique branch
        const timestamp = Date.now()
        const newBranchName = `guestbook/entry-${timestamp}`
        
        // 3a. Get Main SHA
        const mainSha = await getMainBranchSHA(token)
        
        // 3b. Create Branch
        await createBranch(token, newBranchName, mainSha)

        // 4. Commit to NEW branch
		const putRes = await fetch(
			`${GITHUB_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${MESSAGE_PATH}`,
			{
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/vnd.github.v3+json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: `guestbook: new message from ${name}`,
					content: newContentBase64,
					sha: sha, // Use the original file SHA to update it (it's same on new branch)
					branch: newBranchName // IMPORTANT: Target new branch
				})
			}
		)

		if (!putRes.ok) {
            const error = await putRes.text()
            console.error('GitHub Commit Failed:', error)
			throw new Error('Failed to save message')
		}

        // 5. Create Pull Request
        await createPullRequest(
            token, 
            newBranchName, 
            `Guestbook: ${name}`, 
            `User: ${name}\nContent: ${content}\n\nApprove this PR to publish.`
        )

		// Don't revalidate path as it's not on main yet
		return { success: true, message: '留言已提交！审核通过后将显示在网站上。' }
	} catch (error) {
		console.error('Submit Error:', error)
		return { success: false, message: '提交失败，请稍后重试' }
	}
}
