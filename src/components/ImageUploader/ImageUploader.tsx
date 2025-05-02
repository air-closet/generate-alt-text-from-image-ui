import React, { useState, useCallback } from 'react'

interface ImageUploaderProps {
  onImageUpload: (file: File, dataUrl: string) => void
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const processFile = useCallback(
    (file: File) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          setPreviewUrl(dataUrl)
          onImageUpload(file, dataUrl)
        }
        reader.readAsDataURL(file)
      } else {
        // TODO: 画像ファイル以外の場合のエラーハンドリング
        alert('画像ファイルを選択してください。')
        setPreviewUrl(null)
      }
    },
    [onImageUpload]
  )

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // 境界をまたぐ場合にも Leave が発火するため、関連要素かチェックするとより丁寧
    // if (!e.currentTarget.contains(e.relatedTarget as Node)) {
    //   setIsDragging(false)
    // }
    setIsDragging(false) // シンプルにするため、一旦境界離脱でフラグOFF
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // ドロップを許可することを示す
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0])
        e.dataTransfer.clearData()
      }
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0])
        // 同じファイルを連続で選択できるように input の値をリセット
        e.target.value = ''
      }
    },
    [processFile]
  )

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ease-in-out flex flex-col items-center justify-center min-h-[200px] ${
        isDragging
          ? 'border-blue-500 bg-blue-50 scale-105'
          : 'border-gray-300 bg-white hover:bg-gray-50'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()} // divクリックでinputを発火
    >
      <input
        type="file"
        id="fileInput"
        className="hidden" // input自体は隠す
        accept="image/*" // 画像ファイルのみ許可
        onChange={handleFileChange}
      />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Upload preview"
          className="max-h-40 max-w-full object-contain rounded-md mb-4"
        />
      ) : (
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <p className="text-sm text-gray-500">
        {isDragging
          ? 'ここにファイルをドロップ'
          : previewUrl
            ? '画像を変更するには、ドラッグ＆ドロップ または クリック'
            : 'ここに画像をドラッグ＆ドロップするか、クリックしてファイルを選択'}
      </p>
    </div>
  )
}

export default ImageUploader
