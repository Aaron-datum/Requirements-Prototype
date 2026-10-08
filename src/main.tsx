import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '../design-system/colors_and_type.css'
import '../design-system/datum-overrides.css'
import './styles/global.css'
import { Providers } from './app/Providers'
import { routes } from './app/routes'

const router = createBrowserRouter(routes)
createRoot(document.getElementById('root')!).render(
  <StrictMode><Providers><RouterProvider router={router} /></Providers></StrictMode>,
)
