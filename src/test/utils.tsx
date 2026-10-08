import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { buildAppConfig } from '../config/appConfig'
import { ConfigProvider } from '../config/useConfig'
import { ServicesProvider } from '../services/context'

export function renderWithApp(ui: ReactElement, tenantId = 'company-a', route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><ConfigProvider config={buildAppConfig(tenantId)}><ServicesProvider>{ui}</ServicesProvider></ConfigProvider></MemoryRouter>)
}
