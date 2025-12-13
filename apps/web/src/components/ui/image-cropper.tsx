'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './dialog'

interface ImageCropperProps {
    image: string
    onCrop: (croppedImage: string) => void
    onCancel: () => void
    aspectRatio?: number
    circularCrop?: boolean
}

export function ImageCropper({
    image,
    onCrop,
    onCancel,
    aspectRatio = 1,
    circularCrop = true,
}: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                // Use the actual container size
                const rect = containerRef.current.getBoundingClientRect()
                setContainerSize({ width: rect.width, height: rect.height })
            }
        }

        // Initial size
        setTimeout(updateSize, 100)
        
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    // Initialize image position and scale when container size is available
    useEffect(() => {
        if (containerSize.width > 0 && containerSize.height > 0) {
            // This will be handled by the onLoad event of the image
        }
    }, [containerSize])

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return

        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y

        if (imageRef.current && containerSize.width > 0) {
            const img = imageRef.current
            const imgWidth = img.naturalWidth || img.width
            const imgHeight = img.naturalHeight || img.height
            const scaledWidth = imgWidth * scale
            const scaledHeight = imgHeight * scale

            // Constrain position to keep image within bounds
            const maxX = containerSize.width / 2
            const minX = containerSize.width / 2 - scaledWidth
            const maxY = containerSize.height / 2
            const minY = containerSize.height / 2 - scaledHeight

            setPosition({
                x: Math.max(minX, Math.min(maxX, newX)),
                y: Math.max(minY, Math.min(maxY, newY)),
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        // Very controlled zoom - smaller increments
        const zoomSpeed = 0.03 // Even more controlled (3% per scroll)
        const delta = e.deltaY > 0 ? (1 - zoomSpeed) : (1 + zoomSpeed)
        
        // Calculate crop size for min/max limits
        const cropSize = Math.min(containerSize.width, containerSize.height)
        if (imageRef.current && containerSize.width > 0) {
            const img = imageRef.current
            const imgWidth = img.naturalWidth || img.width
            const imgHeight = img.naturalHeight || img.height
            
            // Min scale: image should be at least as large as crop area
            // Max scale: image can be up to 3x the crop area
            const minScale = cropSize / Math.min(imgWidth, imgHeight)
            const maxScale = (cropSize * 3) / Math.min(imgWidth, imgHeight)
            
            const newScale = Math.max(minScale, Math.min(maxScale, scale * delta))
            
            // Calculate mouse position relative to container
            const rect = e.currentTarget.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            
            // Calculate zoom point in image coordinates
            const imageX = (mouseX - position.x) / scale
            const imageY = (mouseY - position.y) / scale
            
            // Calculate new position to keep zoom point under mouse
            setPosition({
                x: mouseX - imageX * newScale,
                y: mouseY - imageY * newScale,
            })
            setScale(newScale)
        }
    }

    const handleCrop = () => {
        if (!canvasRef.current || !imageRef.current || containerSize.width === 0) return

        const canvas = canvasRef.current
        const img = imageRef.current
        const ctx = canvas.getContext('2d')

        if (!ctx) return

        // Set canvas size to crop size (square for circular crop)
        const cropSize = Math.min(containerSize.width, containerSize.height)
        canvas.width = cropSize
        canvas.height = cropSize

        // Calculate the center of the crop circle in container coordinates
        const cropCenterX = containerSize.width / 2
        const cropCenterY = containerSize.height / 2
        
        // Calculate the top-left corner of the crop circle in container coordinates
        const cropTopLeftX = cropCenterX - cropSize / 2
        const cropTopLeftY = cropCenterY - cropSize / 2
        
        // Convert crop area coordinates to image coordinates
        // The position is the top-left of the scaled image in container coordinates
        // We need to find what part of the image is visible in the crop circle
        const imageX = (cropTopLeftX - position.x) / scale
        const imageY = (cropTopLeftY - position.y) / scale
        const imageSize = cropSize / scale
        
        // Ensure we don't go out of bounds
        const imgWidth = img.naturalWidth || img.width
        const imgHeight = img.naturalHeight || img.height
        
        const sourceX = Math.max(0, Math.min(imgWidth - imageSize, imageX))
        const sourceY = Math.max(0, Math.min(imgHeight - imageSize, imageY))
        const actualSize = Math.min(imageSize, imgWidth - sourceX, imgHeight - sourceY)

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (circularCrop) {
            // Create circular clipping path
            ctx.beginPath()
            ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2)
            ctx.clip()
        }

        // Draw the exact portion of the image that's visible in the crop circle
        ctx.drawImage(
            img,
            sourceX,
            sourceY,
            actualSize,
            actualSize,
            0,
            0,
            cropSize,
            cropSize
        )

        // Convert to base64 with better quality
        const croppedImage = canvas.toDataURL('image/jpeg', 0.95)
        onCrop(croppedImage)
    }

    const cropSize = Math.min(containerSize.width, containerSize.height)

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="max-w-3xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Recortar Imagen</DialogTitle>
                    <DialogDescription>
                        Arrastra para mover la imagen, usa la rueda del mouse para hacer zoom. 
                        El área circular muestra cómo se verá tu foto de perfil.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div
                        ref={containerRef}
                        className="relative w-full min-h-[500px] h-[500px] bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden cursor-move border-2 border-gray-300 dark:border-gray-700"
                        style={{ minWidth: '500px' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    >
                        {/* Image */}
                        {image && (
                            <img
                                ref={imageRef}
                                src={image}
                                alt="Preview"
                                className="absolute top-0 left-0"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: 'top left',
                                    maxWidth: 'none',
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    display: 'block',
                                }}
                                onLoad={(e) => {
                                    const img = e.currentTarget
                                    // Wait a bit for container to be ready
                                    setTimeout(() => {
                                        if (containerSize.width > 0 && img.naturalWidth > 0) {
                                            const cropSize = Math.min(containerSize.width, containerSize.height)
                                            
                                            // Calculate scale so the image fits nicely in the container
                                            // We want the image to be visible but not too zoomed in
                                            // Use the larger dimension to ensure the image covers the crop area
                                            const imgMaxDimension = Math.max(img.naturalWidth, img.naturalHeight)
                                            
                                            // Scale so that the larger dimension of the image is about 1.3x the crop size
                                            // This gives a nice zoomed-out view that's not too extreme
                                            const initialScale = (cropSize * 1.3) / imgMaxDimension
                                            
                                            setScale(initialScale)
                                            
                                            // Center the image in the container
                                            const scaledWidth = img.naturalWidth * initialScale
                                            const scaledHeight = img.naturalHeight * initialScale
                                            setPosition({
                                                x: (containerSize.width - scaledWidth) / 2,
                                                y: (containerSize.height - scaledHeight) / 2,
                                            })
                                        }
                                    }, 100)
                                }}
                            />
                        )}

                        {/* Crop overlay */}
                        <div
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{
                                width: cropSize,
                                height: cropSize,
                            }}
                        >
                            {/* Circular crop guide */}
                            {circularCrop && (
                                <div
                                    className="w-full h-full rounded-full border-4 border-blue-500 shadow-lg"
                                    style={{
                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                    }}
                                />
                            )}
                        </div>

                        {/* Zoom controls hint */}
                        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-3 py-2 rounded">
                            Rueda del mouse: Zoom | Arrastra: Mover
                        </div>
                    </div>

                    {/* Hidden canvas for cropping */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCrop}>
                        Aplicar Recorte
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
