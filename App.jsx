import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Award,
  Activity,
  Star,
  Sparkles,
  ArrowRight,
  Info,
  HelpCircle,
  FileText,
  RefreshCw,
  Heart,
  Leaf
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [usingSimulator, setUsingSimulator] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef(null);

  const mockCases = [
    {
      id: 'caso-exito-reforestacion',
      name: 'Plantando un Árbol (Aprobado - Máximo Puntaje)',
      description: 'Foto real de un estudiante sonriente sembrando una planta en el patio de la escuela.',
      mockData: {
        esRelevante: true,
        esReal: true,
        tipoActividad: 'Reforestación Estudiantil',
        nivelImpacto: 'Alto',
        puntosGanados: 95,
        explicacion:
          'Se observa de forma clara y nítida la interacción directa del estudiante sembrando una planta joven. Los detalles de la tierra húmeda, las sombras naturales de la luz solar y los metadatos visuales certifican que es una fotografía física y real capturada por un celular. ¡Excelente trabajo y aporte ecológico!'
      }
    },
    {
      id: 'caso-exito-reciclaje',
      name: 'Clasificando Plástico (Aprobado - Puntaje Medio)',
      description: 'Foto real de unas manos depositando botellas de plástico en un contenedor verde.',
      mockData: {
        esRelevante: true,
        esReal: true,
        tipoActividad: 'Reciclaje de Envases PET',
        nivelImpacto: 'Medio',
        puntosGanados: 75,
        explicacion:
          'La imagen captura el momento exacto en el que se deposita plástico en el cesto de reciclaje correcto. Se valida que es una fotografía real tomada en un espacio público. El esfuerzo de clasificar los residuos suma puntos importantes a tu perfil escolar.'
      }
    },
    {
      id: 'caso-trampa-dibujo',
      name: 'Dibujo de Reciclaje (Rechazado - No es Foto Real)',
      description: 'Una ilustración digital o dibujo animado de botes de basura felices.',
      mockData: {
        esRelevante: true,
        esReal: false,
        tipoActividad: 'Ilustración Digital',
        nivelImpacto: 'Ninguno',
        puntosGanados: 0,
        explicacion:
          'El contenido trata sobre reciclaje, pero el sistema detectó que la imagen NO es una fotografía real tomada en el mundo físico. Se trata de un dibujo, gráfico digital o vector. Para ganar puntos, debes subir fotos reales de tus propias acciones.'
      }
    },
    {
      id: 'caso-trampa-comida',
      name: 'Plato de Comida (Rechazado - No es Ambiental)',
      description: 'Fotografía real de una hamburguesa sobre un plato en una mesa.',
      mockData: {
        esRelevante: false,
        esReal: true,
        tipoActividad: 'Consumo de Alimentos',
        nivelImpacto: 'Ninguno',
        puntosGanados: 0,
        explicacion:
          'La fotografía es 100% auténtica y real, sin embargo, el contenido visual no tiene relación alguna con el cuidado del medio ambiente, la preservación de la naturaleza ni tareas de reciclaje escolar. Por lo tanto, no se otorgan puntos.'
      }
    }
  ];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('El archivo seleccionado debe ser una imagen válida (Formatos permitidos: JPG, PNG, WEBP).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setUsingSimulator(false);
    }
  };

  const fetchWithRetry = async (url, options, retries = 5) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || `Error del Servidor HTTP: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((res) => setTimeout(res, delays[i]));
      }
    }
  };

  const analyzeImageWithIA = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona o arrastra una foto antes de enviar a evaluar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append('photo', selectedFile);
      form.append('challenge', 'recycle-classroom');
      form.append('participant', 'demo-student');
      form.append('mode', 'individual');

      const data = await fetchWithRetry(`${API_BASE_URL}/v1/evidence`, {
        method: 'POST',
        body: form
      });

      setResult({
        esRelevante: data.ai_verified,
        esReal: !data.duplicate,
        tipoActividad: data.ai_verified ? 'Reciclaje en el aula' : 'Ninguna actividad válida',
        nivelImpacto: !data.ai_verified ? 'Ninguno' : data.confidence >= 0.9 ? 'Alto' : data.confidence >= 0.7 ? 'Medio' : 'Bajo',
        puntosGanados: data.points_awarded ?? 0,
        explicacion:
          data.message ||
          `Evidencia verificada con ${Math.round((data.confidence ?? 0) * 100)}% de confianza. ¡Buen trabajo cuidando el medio ambiente!`
      });
    } catch (err) {
      console.error('Falla en el pipeline de análisis de IA:', err);
      setError(
        `Ocurrió un error al procesar tu foto: ${err.message}. Verifica que el backend (server.ts) y el servicio de IA (ai_service.py) estén corriendo, o usa el simulador interactivo más abajo.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateCase = (mockCase) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setUsingSimulator(true);

    setTimeout(() => {
      setResult(mockCase.mockData);
      setPreviewUrl(null);
      setSelectedFile(null);
      setIsLoading(false);
    }, 750);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setUsingSimulator(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 pb-12">
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 block">EcoEscuela IA</span>
              <span className="text-[10px] text-slate-400 block -mt-1">AstroGalaxy · Verificación de Evidencia</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Mostrar Guía de Criterios"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100">
              Backend Conectado
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Auditoría Ecológica Digital
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                La Inteligencia Artificial validará que tu fotografía escolar sea verídica, original y contenga una acción de impacto ambiental positivo.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current.click()}
              className={`group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 min-h-[220px]
                ${previewUrl ? 'border-emerald-500 bg-emerald-50/5' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}
            >
              {previewUrl ? (
                <div className="relative w-full flex flex-col items-center py-2">
                  <img src={previewUrl} alt="Evidencia del alumno" className="max-h-60 object-cover rounded-xl shadow-md border border-slate-100" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-slate-950/75 px-4 py-2 rounded-xl backdrop-blur-sm">
                      Reemplazar Fotografía
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto bg-slate-100 p-4 rounded-full inline-block group-hover:bg-emerald-50 transition-colors">
                    <UploadCloud className="h-7 w-7 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-700 block">Sube la fotografía de tu acción</span>
                    <span className="text-[11px] text-slate-400 block mt-1">Soporta formatos estándar de imagen hasta 10 Megabytes</span>
                  </div>
                </div>
              )}

              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>

            {error && (
              <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">Aviso del Sistema</h4>
                  <p className="text-[11px] text-amber-700 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={analyzeImageWithIA}
                disabled={!selectedFile || isLoading}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 px-6 rounded-xl text-xs font-bold text-white shadow-sm transition-all
                  ${!selectedFile || isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md shadow-emerald-600/10'}`}
              >
                {isLoading && !usingSimulator ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>La Inteligencia Artificial está auditando tu foto...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar a Evaluación Directa (IA)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {previewUrl && (
                <button
                  onClick={handleReset}
                  className="px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                >
                  Limpiar Todo
                </button>
              )}
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Resultados del Análisis
                </h3>
                {usingSimulator && (
                  <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Modo Simulador Activo
                  </span>
                )}
              </div>

              <div
                className={`p-6 rounded-2xl text-center border-2 ${
                  result.puntosGanados > 0 ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100'
                }`}
              >
                <div className="inline-flex items-center justify-center p-3.5 bg-white rounded-2xl shadow-sm mb-3.5">
                  <Award className={`h-9 w-9 ${result.puntosGanados > 0 ? 'text-emerald-600' : 'text-rose-500'}`} />
                </div>

                <h3 className={`text-4xl font-black tracking-tight ${result.puntosGanados > 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                  {result.puntosGanados > 0 ? `+${result.puntosGanados} PUNTOS` : 'Puntos no ganados'}
                </h3>

                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">
                  {result.puntosGanados > 0 ? '¡Felicidades, reto superado con éxito!' : 'Misión pendiente de revisión'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/65 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">¿Es Contenido Ambiental?</span>
                  <div className="flex items-center gap-2 mt-3">
                    {result.esRelevante ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-extrabold text-slate-700">Contenido Válido</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                        <span className="text-xs font-extrabold text-rose-600">Sin Contenido Ecológico</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/65 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">¿Es una Fotografía Real?</span>
                  <div className="flex items-center gap-2 mt-3">
                    {result.esReal ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-extrabold text-slate-700">Fotografía Auténtica</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                        <span className="text-xs font-extrabold text-rose-600">Trampa / IA / Dibujo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/65 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Actividad Clasificada</span>
                  <span className="text-xs font-extrabold text-slate-700 mt-3 truncate block">
                    {result.tipoActividad || 'Ninguna actividad válida'}
                  </span>
                </div>

                <div className="bg-slate-50/65 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Nivel de Impacto Ecológico</span>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Star className={`h-4 w-4 ${result.nivelImpacto !== 'Ninguno' ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    <span className="text-xs font-extrabold text-slate-700">{result.nivelImpacto || 'Ninguno'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Retroalimentación del Inspector IA:</span>
                <p className="text-xs text-slate-600 leading-relaxed italic font-medium">"{result.explicacion}"</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Simulador de Casos</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Útil para probar rápidamente todos los estados (puntos sumados, puntos no ganados por imagen falsa o por contenido incorrecto) sin necesidad de API Key.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {mockCases.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSimulateCase(item)}
                  disabled={isLoading}
                  className="text-left p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-100 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-slate-800">{item.name}</span>
                    <span className="text-[9px] font-bold bg-white text-indigo-600 border border-slate-200 px-1.5 py-0.5 rounded">Simular</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1.5 leading-snug">{item.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Estadísticas del Alumno</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Misiones Completadas</span>
                <span className="text-xs font-bold text-slate-800">14 retos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Puntaje Acumulado</span>
                <span className="text-xs font-extrabold text-emerald-600">1,240 Puntos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Nivel Ecológico</span>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">Guardián de la Tierra</span>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Próximo Rango</span>
                  <span>80%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {showGuide && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-600" />
                Guía de Evaluación Escolar
              </h3>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Para garantizar la transparencia del concurso ecológico del colegio, nuestro sistema de Inteligencia Artificial aplica las siguientes reglas estrictas:
              </p>

              <ul className="space-y-3.5 pt-2">
                <li className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0 text-xs font-bold mt-0.5">1</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Cero Tolerancia a Trampas</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      No se aceptarán capturas de videojuegos, imágenes de internet o dibujos. Solo fotografías originales en vivo.
                    </p>
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0 text-xs font-bold mt-0.5">2</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Relevancia Ecológica</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      La foto debe mostrarte realizando una tarea ecológica concreta. Fotos de comida o pasatiempos no suman puntos.
                    </p>
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0 text-xs font-bold mt-0.5">3</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Cálculo de Esfuerzo</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      A mayor complejidad de la acción, la IA asignará mayor puntaje.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          )}

          <div className="text-center py-4 bg-slate-100 rounded-2xl border border-slate-200/50">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block">AstroGalaxy</span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
              Hecho con <Heart className="h-3.5 w-3.5 text-rose-500 fill-current" /> para proyectos estudiantiles
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
