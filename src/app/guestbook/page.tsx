import GuestbookClient from './guestbook-client'
import fs from 'fs'
import path from 'path'

// Force dynamic rendering to ensure we always see the latest messages on refresh
export const dynamic = 'force-dynamic'

async function getMessages() {
    // In production/build, we might want to fetch from GitHub API directly 
    // to ensure we get the latest commit data, or use the local file if it's ISR.
    // For simplicity in this hybrid model, we read the local file which is part of the repo.
    // Note: On Vercel/Cloud, local file system is read-only and ephemeral. 
    // Real-world: Fetch from GitHub API or database.
    // Here we simulate fetching from "DB" (the JSON file in the repo).
    
    // Attempt to read local file (works in dev, and build time)
    try {
        const filePath = path.join(process.cwd(), 'src/app/guestbook/messages.json')
        // In local dev, read from filesystem
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(fileContent)
    } catch (e) {
        // Fallback: Fetch directly from GitHub raw content (ensure persistence across serverless executions)
        // This is robust for Vercel deployment
        try {
             // We can use the fetch approach from actions.ts logic or simple raw.githubusercontent
             // Using raw fetch for speed
             const rawUrl = `https://raw.githubusercontent.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/${process.env.NEXT_PUBLIC_GITHUB_BRANCH}/src/app/guestbook/messages.json`
             const res = await fetch(rawUrl, { cache: 'no-store' })
             if(res.ok) return await res.json()
        } catch(githubErr) {
             console.error('Failed to fetch messages', githubErr)
        }
        return []
    }
}

export default async function GuestbookPage() {
    const messages = await getMessages()
    
    return <GuestbookClient initialMessages={messages} />
}
