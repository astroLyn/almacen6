// prueba-estres.js
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21icmVVc3VhcmlvIjoiakFyZWxsYW5vIiwiYWNjZXNvIjoiRU5DIiwiaWF0IjoxNzg5MDk3Nzc2LCJleHAiOjE3ODkxMjY1NzZ9.K3yKGP8zlb21TdZMJzK9Y_N9GS86mBkZz4mUVPwdKZ4"; 
const URL_API = "http://localhost:3000/api/materiales";

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${TOKEN}`
};

// Objeto de prueba para reactivar/crear
const materialPrueba = {
  codigoMaterial: "TEST-AUTO-01",
  descripcion: "Material de Prueba Automatizada",
  categoria: 1, // Ajusta si es necesario
  ubicacion: 1,
  marca: 1,
  proveedor: 1,
  stockActual: 10,
  stockMinimo: 5,
  unidadMedida: "Pieza"
};

async function ejecutarPruebaAutomática() {
  console.log("🚀 Iniciando prueba automatizada...");

  try {
    // 1. Prueba de Reactivación / Creación
    console.log("📦 1. Intentando crear o reactivar material...");
    const resCrear = await fetch(URL_API, {
      method: "POST",
      headers,
      body: JSON.stringify(materialPrueba)
    });
    const dataCrear = await resCrear.json();
    console.log("Respuesta creación:", dataCrear);

    // 2. Prueba de Estrés (Bloqueos)
    console.log("🔥 2. Disparando 25 ediciones simultáneas para probar el Pool de Conexiones...");
    
    // Creamos 25 peticiones PUT al mismo tiempo
    const peticionesSimultaneas = Array.from({ length: 25 }).map((_, index) => {
      return fetch(`${URL_API}/TEST-AUTO-01`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...materialPrueba, descripcion: `Edición múltiple #${index}` })
      }).then(res => res.json());
    });

    // Esperamos a que TODAS terminen de golpe
    const resultados = await Promise.all(peticionesSimultaneas);
    
    console.log(`✅ ¡Prueba finalizada! Se procesaron ${resultados.length} peticiones sin bloquearse.`);
    console.log("Última respuesta recibida:", resultados[resultados.length - 1]);

  } catch (error) {
    console.error("❌ El sistema falló o se bloqueó:", error);
  }
}

ejecutarPruebaAutomática();