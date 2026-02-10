'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Send, User, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { submitGuestbookMessage } from './actions'

interface GuestbookMessage {
	id: string
	name: string
	content: string
	date: string
}

export default function GuestbookClient({ initialMessages }: { initialMessages: GuestbookMessage[] }) {
	const [name, setName] = useState('')
	const [content, setContent] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim() || !content.trim()) {
			toast.error('请填写所有必填项')
			return
		}

		setIsSubmitting(true)

		const formData = new FormData()
		formData.append('name', name)
		formData.append('content', content)

		const result = await submitGuestbookMessage(formData)

		if (result.success) {
			toast.success(result.message)
			setName('')
			setContent('')
		} else {
			toast.error(result.message || '发送失败，请稍后重试')
		}
		
		setIsSubmitting(false)
	}

	return (
		<div className='container mx-auto max-w-4xl px-4 py-8 md:py-20'>
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className='mb-8 text-center md:mb-10'>
				<h1 className='text-primary mb-4 flex items-center justify-center gap-3 text-3xl font-bold md:text-4xl'>
					<MessageCircle className='h-8 w-8 md:h-10 md:w-10' />
					留言板
				</h1>
				<p className='text-secondary text-base text-center md:text-lg'>欢迎留言，或只是打个招呼！</p>
			</motion.div>

			<div className='flex flex-col-reverse gap-8 md:grid md:grid-cols-[1fr_350px]'>
				{/* Messages List */}
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className='space-y-4'>
					{initialMessages.map((msg, index) => (
						<motion.div
							key={msg.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 * index }}
							className='bg-white/40 border-white/30 rounded-2xl border p-6 shadow-sm backdrop-blur-md'
						>
							<div className='flex items-start gap-4'>
								<div className='bg-brand/10 shrink-0 rounded-full p-3'>
									<User className='text-brand h-6 w-6' />
								</div>
								<div className='flex-1'>
									<div className='mb-2 flex items-center justify-between'>
										<h3 className='text-primary font-bold'>{msg.name}</h3>
										<span className='text-secondary text-sm'>{msg.date}</span>
									</div>
									<p className='text-primary/80 leading-relaxed'>{msg.content}</p>
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>

				{/* Input Form */}
				<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
					<div className='bg-white/60 border-white/40 md:sticky md:top-24 rounded-3xl border p-6 shadow-lg backdrop-blur-xl'>
						<h3 className='text-primary mb-6 flex items-center gap-2 text-xl font-bold'>
							<Send className='h-5 w-5' />
							写点什么
						</h3>

						<form onSubmit={handleSubmit} className='space-y-4'>
							<div>
								<label className='text-secondary mb-1 block text-sm font-medium'>昵称</label>
								<input
									type='text'
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder='你的名字'
									className='border-black/10 bg-white/50 focus:border-brand/50 focus:ring-brand/10 w-full rounded-xl border px-4 py-2 outline-none transition-all focus:ring-2'
								/>
							</div>

							<div>
								<label className='text-secondary mb-1 block text-sm font-medium'>留言内容</label>
								<textarea
									value={content}
									onChange={e => setContent(e.target.value)}
									placeholder='说点好听的...'
									rows={4}
									className='border-black/10 bg-white/50 focus:border-brand/50 focus:ring-brand/10 w-full resize-none rounded-xl border px-4 py-2 outline-none transition-all focus:ring-2'
								/>
							</div>

							<button
								type='submit'
								disabled={isSubmitting}
								className='bg-brand hover:bg-brand/90 active:scale-95 w-full rounded-xl py-3 font-bold text-white shadow-md transition-all disabled:opacity-70 disabled:hover:scale-100'
							>
								{isSubmitting ? '发送中...' : '发送留言'}
							</button>
						</form>
					</div>
				</motion.div>
			</div>
		</div>
	)
}
