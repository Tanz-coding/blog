'use client'

import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import DotsSVG from '@/svgs/dots.svg'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useConfigStore } from './stores/config-store'
import { useCenterStore } from '@/hooks/use-center'
import { useSize } from '@/hooks/use-size'
import { HomeDraggableLayer } from './home-draggable-layer'

export default function ConfigButton() {
	const center = useCenterStore()
	const { cardStyles, setConfigDialogOpen } = useConfigStore()
	const { maxSM } = useSize()

	const styles = (cardStyles as any).configButton
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard
	const writeButtonsStyles = cardStyles.writeButtons

	const [show, setShow] = useState(false)

	useEffect(() => {
		if (styles) {
			setTimeout(() => setShow(true), styles.order * ANIMATION_DELAY * 1000)
		}
	}, [styles?.order])

	if (maxSM) return null
	if (!styles) return null
	if (!show) return null

	const defaultX = center.x + CARD_SPACING + hiCardStyles.width / 2 + writeButtonsStyles.width + 16

	const x = styles.offsetX !== null ? center.x + styles.offsetX : defaultX
	const y =
		styles.offsetY !== null
			? center.y + styles.offsetY
			: center.y - clockCardStyles.offset - styles.height - CARD_SPACING / 2 - clockCardStyles.height

	return (
		<HomeDraggableLayer cardKey='configButton' x={x} y={y} width={styles.width} height={styles.height}>
			<motion.div initial={{ left: x, top: y }} animate={{ left: x, top: y }} className='absolute flex items-center justify-center'>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setConfigDialogOpen(true)}
					className='p-2'>
					<DotsSVG className='h-6 w-6' />
				</motion.button>
			</motion.div>
		</HomeDraggableLayer>
	)
}
