import { useDropzone } from "react-dropzone";

export default function FileUpload({ files, setFiles }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    onDrop: (accepted) => setFiles(accepted),
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="file-upload">
      <div
        {...getRootProps({
          className: `dropzone ${isDragActive ? "drag-active" : ""}`,
        })}
      >
        <input {...getInputProps()} />
        <div className="dropzone-icon">📁</div>
        {isDragActive ? (
          <p className="dropzone-text">Drop PDFs here...</p>
        ) : (
          <>
            <p className="dropzone-text">Drag & drop PDF resumes here</p>
            <p className="dropzone-hint">or click to browse files</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <p className="file-list-title">Selected Files ({files.length})</p>
          {files.map((file, index) => (
            <div key={file.name + index} className="file-item">
              <div className="file-icon">📄</div>
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatFileSize(file.size)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
