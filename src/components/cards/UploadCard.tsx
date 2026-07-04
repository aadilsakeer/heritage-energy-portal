import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileUp, UploadCloud } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface UploadCardProps {
  onFileSelect?: (file: File) => void
}

export function UploadCard({ onFileSelect }: UploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      setSelectedFile(file)
      onFileSelect?.(file)
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="p-5 sm:p-8">
          <div
            {...getRootProps()}
            className={cn(
              'flex min-h-[240px] flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50',
            )}
          >
            <input {...getInputProps()} />
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <UploadCloud className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-semibold tracking-tight">
              {isDragActive ? 'Drop your file here' : 'Upload meter reading'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Drag and drop a PDF or image, or choose a file from your device.
            </p>

            {selectedFile ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-sm text-primary">
                <FileUp className="h-4 w-4" />
                {selectedFile.name}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={open}>
                <UploadCloud className="h-4 w-4" />
                Upload File
              </Button>
              <Button type="button" variant="outline" disabled>
                Analyze
              </Button>
              <Button type="button" variant="accent" disabled>
                Publish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
