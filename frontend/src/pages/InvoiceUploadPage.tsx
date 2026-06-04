import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUploadInvoiceMutation } from "@/features/api/invoicesApi";

const isValidFileType = (file: File) => {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  return validTypes.includes(file.type);
};

export function InvoiceUploadPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"IDLE" | "UPLOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadInvoice] = useUploadInvoiceMutation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile);
        setUploadStatus("IDLE");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile);
        setUploadStatus("IDLE");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploadStatus("UPLOADING");
    setProgress(50); // Just a simple visual cue since it's a mutation
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const result = await uploadInvoice(formData).unwrap();
      setProgress(100);
      setUploadStatus("SUCCESS");
      
      setTimeout(() => {
        navigate(`/invoices/${result.invoice_id}`);
      }, 1500);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus("ERROR");
      setProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus("IDLE");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pt-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Upload Invoice</h2>
        <p className="text-muted-foreground font-medium">Upload a PDF or Image for AI extraction and analysis.</p>
      </div>

      <Card className="border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
        <CardContent className="p-0">
          {!file ? (
            <div 
              className={`relative flex flex-col items-center justify-center p-16 text-center border-2 border-dashed transition-all duration-200 min-h-[400px] ${
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              
              <div className={`p-4 rounded-full mb-6 transition-all duration-200 ${isDragging ? "bg-primary/20 text-primary scale-110" : "bg-slate-100 text-slate-400"}`}>
                <UploadCloud className="w-10 h-10" strokeWidth={2} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Drag & Drop your invoice here
              </h3>
              <p className="text-slate-500 font-medium mb-8 max-w-sm">
                Supports PDF, JPG, and PNG files up to 10MB in size.
              </p>
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="font-bold px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                size="lg"
              >
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="p-8 sm:p-12 flex flex-col items-center min-h-[400px] justify-center bg-slate-50/30">
              <div className="w-full max-w-md bg-white border border-slate-100 p-6 rounded-2xl shadow-sm relative">
                {uploadStatus === "IDLE" && (
                  <button 
                    onClick={removeFile}
                    className="absolute -top-3 -right-3 p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-full shadow-sm transition-all"
                  >
                    <X className="w-4 h-4" strokeWidth={3} />
                  </button>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <File className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                  
                  {uploadStatus === "SUCCESS" && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  )}
                  {uploadStatus === "ERROR" && (
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                  )}
                </div>

                {uploadStatus === "UPLOADING" && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-primary">
                      <span>Uploading & Extracting...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-primary/10" />
                  </div>
                )}
                
                {uploadStatus === "SUCCESS" && (
                  <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg text-center">
                    Successfully uploaded! Redirecting...
                  </div>
                )}
              </div>

              {uploadStatus === "IDLE" && (
                <div className="mt-10 flex gap-4">
                  <Button variant="outline" onClick={removeFile} className="font-semibold bg-white px-8">
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} className="font-bold px-8 shadow-lg shadow-primary/25">
                    Process Invoice
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
