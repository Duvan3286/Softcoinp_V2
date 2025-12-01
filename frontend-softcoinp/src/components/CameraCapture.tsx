"use client";
import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onPhotoTaken: (imageDataUrl: string) => void;
  // Opcional: para cerrar el componente si se cancela
  onClose: () => void; 
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoTaken, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Iniciar la cámara al montar el componente
  useEffect(() => {
    const startCamera = async () => {
      setError(null);
      try {
        // Solicita acceso a la cámara (video)
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        setError("❌ No se pudo acceder a la cámara. Asegúrate de dar permiso.");
      }
    };

    startCamera();

    // 2. Limpieza: Detener el stream de la cámara cuando el componente se desmonta
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Función para tomar la foto
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ajustar el canvas al tamaño del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        // Dibujar el fotograma actual del video en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir la imagen del canvas a una URL de datos (formato PNG o JPEG)
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); 
        
        // Llamar a la función del padre para guardar la foto
        onPhotoTaken(imageDataUrl);
        
        // Opcional: Cerrar el componente de la cámara
        onClose(); 
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 relative">
        <h3 className="text-xl font-bold mb-4 text-blue-700">Captura de Fotografía</h3>
        
        {error && (
            <p className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</p>
        )}

        <div className="w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
          {/* El video oculta el stream de la cámara */}
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
        </div>

        {/* El canvas se usa para capturar el fotograma, se mantiene oculto */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 py-2 px-6 rounded-lg font-semibold hover:bg-gray-400 transition duration-200"
            disabled={!stream}
          >
            Cancelar
          </button>
          <button
            onClick={takePhoto}
            className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
            disabled={!stream}
          >
            📸 Tomar Foto
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;