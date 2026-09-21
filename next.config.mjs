/** @type {import('next').NextConfig} */
const nextConfig = {
  // ignoreBuildErrors estava ligado e escondeu a incompatibilidade de tipos de
  // fontes_em_defeso (string[] no portal x objeto no backend): o build da
  // Vercel passava e a pagina so quebrava no navegador. Com a checagem ligada,
  // uma divergencia de tipos entre os dois repositorios falha o deploy.
  images: {
    unoptimized: true,
  },
}

export default nextConfig
