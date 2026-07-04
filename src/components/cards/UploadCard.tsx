import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileUp, LoaderCircle, UploadCloud } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface UploadCardProps {
  propertyLabel?: string
  isBusy?: boolean
  progress?: number
  progressLabel?: string
  error?: string | null
  onUpload: (file: File) => Promise<void> | void
}

export function UploadCard({
  propertyLabel,
  isBusy = false,
  progress = 0,
  progressLabel,
  error,
  onUpload,
}: UploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      setSelectedFile(file)
      await onUpload(file)
    },
    [onUpload],
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file || isBusy) return
      void handleUpload(file)
    },
    [handleUpload, isBusy],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    disabled: isBusy,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
        <CardContent className="p-5 sm:p-8">
          <div
            {...getRootProps()}
            className={cn(
              'flex min-h-[240px] flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50',
              isBusy && 'pointer-events-none opacity-80',
            )}
          >
            <input {...getInputProps()} aria-label="Meter reading file" />
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              {isBusy ? (
                <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
              ) : (
                <UploadCloud className="h-7 w-7" aria-hidden="true" />
              )}
            </span>
            <h3 className="text-lg font-semibold tracking-tight">
              {isDragActive
                ? 'Drop your file here'
                : isBusy
                  ? progressLabel ?? 'Processing…'
                  : 'Upload meter reading'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Property is detected automatically from the consumer number on the bill.
              {propertyLabel ? ` Manual selection: ${propertyLabel}.` : ''}
            </p>

            {selectedFile && !isBusy ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-sm text-primary">
                <FileUp className="h-4 w-4" aria-hidden="true" />
                {selectedFile.name}
              </div>
            ) : null}

            {isBusy ? (
              <div className="mt-5 w-full max-w-sm space-y-2">
                <Progress value={progress} aria-label={progressLabel ?? 'Progress'} />
                <p className="text-xs text-muted-foreground">{progress}% · {progressLabel}</p>
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6">
              <Button
                type="button"
                onClick={open}
                disabled={isBusy}
                aria-label="Upload meter reading file"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Upload File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
