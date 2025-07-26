
import React, { useCallback, useState } from 'react';
import { Upload, FileText, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function FileUploadZone({ onFileSelect, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => 
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    
    if (validFile) {
      onFileSelect(validFile);
    }
  }, [onFileSelect]);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Card className={`transition-all duration-300 ${dragActive ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'} ${isProcessing ? 'opacity-75 pointer-events-none' : ''}`}>
      <CardContent className="p-8">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="text-center space-y-6"
        >
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-gray-500 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-gray-500" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {isProcessing ? 'Processing Your Notes...' : 'Upload Handwritten Notes'}
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {isProcessing 
                ? 'Converting your handwriting to text using advanced AI' 
                : 'Drop your PDF or image files here, or click to browse'
              }
            </p>
          </div>

          {!isProcessing && (
            <>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <FileText className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700">PDF Documents</span>
                </div>
                <div className="text-center">
                  <Image className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Images (JPG, PNG)</span>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileInput}
                />
                <Button
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Choose File
                </Button>
                <p className="text-xs text-gray-500">
                  Maximum file size: 10MB • Supports handwritten text recognition
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
