import { useDropzone } from 'react-dropzone';

export default function FileUpload({ files, setFiles }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    onDrop: accepted => setFiles(accepted)
  });

  return (
    <div className="file-upload">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop here…</p> : <p>Drag PDFs or click to browse</p>}
      </div>
      {files.length > 0 && (
        <ul>
          {files.map((f) => <li key={f.name}>{f.name}</li>)}
        </ul>
      )}
    </div>
  );
}