'use client'

import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { HomeDraggableLayer } from './home-draggable-layer'
import { CARD_SPACING } from '@/consts'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { getGuestbookMessages } from '@/app/guestbook/actions'
import { useEffect, useState } from 'react'

interface GuestbookMessage {
	id: string
	name: string
	content: string
	date: string
}

export default function GuestbookCard() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const styles = (cardStyles as any).guestbookCard // Temporary cast untill types are updated
	const hiCardStyles = cardStyles.hiCard
	const [messages, setMessages] = useState<GuestbookMessage[]>([])

	useEffect(() => {
		getGuestbookMessages().then(msgs => {
			if (msgs && msgs.length > 0) {
				setMessages(msgs.slice(0, 2))
			}
		})
	}, [])

	// Fallback if styles haven't loaded yet or config is missing
	if (!styles) return null

	// Default position: To the right of the HiCard if no custom offset is saved
	// If offsets are null, we calculate a default position
	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + hiCardStyles.width / 2 + CARD_SPACING
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - styles.height / 2

	return (
		// @ts-ignore - cardKey constraint might check strictly against keys, using cast if needed
		<HomeDraggableLayer cardKey='guestbookCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card
				order={styles.order}
				width={styles.width}
				height={styles.height}
				x={x}
				y={y}
				className='max-sm:!h-auto max-sm:!w-full flex flex-col p-5 backdrop-blur-md max-sm:static'
			>
				{/* Header */}
				<div className='mb-3 flex items-center justify-between'>
					<h2 className='text-secondary select-none text-sm font-bold'>留言板</h2>
					<Link
						href='/guestbook'
						className='hover:bg-brand/10 text-secondary hover:text-primary relative z-50 -mr-2 -mt-2 rounded-full p-2 transition-all active:scale-95'
						title='打开留言板'
					>
						<ExternalLink size={16} />
					</Link>
				</div>

				{/* List Area */}
				<div className='scrollbar-none mask-image-fade-bottom max-sm:max-h-[200px] flex-1 space-y-3 overflow-y-auto pr-1'>
					{messages.length === 0 && <div className='py-4 text-center text-xs text-gray-500'>加载中...</div>}
					{messages.map(msg => (
						<div key={msg.id} className='bg-white/40 rounded-xl border border-white/30 p-3 shadow-sm'>
							<div className='flex items-center justify-between mb-1'>
								<span className='text-primary/90 text-sm font-medium'>{msg.name}</span>
								<span className='text-secondary text-[10px]'>{msg.date}</span>
							</div>
							<p className='text-primary/80 break-words text-xs leading-relaxed'>{msg.content}</p>
						</div>
					))}
				</div>

				{/* Form Area */}
				<div className='border-white/20 mt-3 border-t pt-3'>
					<Link
						href='/guestbook'
						className='bg-brand/10 hover:bg-brand/20 text-brand active:scale-95 flex w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-bold transition-all'
					>
						跟Tenz聊聊你的想法
					</Link>
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
