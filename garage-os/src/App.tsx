import { useState } from 'react'
import { useAuth } from './components/AuthContext'
import { useGarage } from './hooks/useGarage'
import { Login } from './components/Login'
import { Signup } from './components/Signup'
import { SubscriptionGate } from './components/SubscriptionGate'
import { GarageSetupModal } from './components/GarageSetupModal'
import { AppLayout } from './components/AppLayout'
import type { AppPage } from './components/Navbar'
import { Dashboard } from './components/Dashboard'
import { JobTicketForm } from './components/JobTicketForm'
import { InvoiceView } from './components/InvoiceView'
import { ServiceReminders } from './components/ServiceReminders'
import { ClientsView } from './components/ClientsView'
import { FinancesView } from './components/FinancesView'
import { ProfileView } from './components/ProfileView'
import { JobWithDetails, Client, Vehicle } from './types/database'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, loading: authLoading } = useAuth()
  const { garage, loading: garageLoading, profileMissing, fetchGarage } = useGarage()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')
  const [appPage, setAppPage] = useState<AppPage>('dashboard')
  const [editJobId, setEditJobId] = useState<string | null>(null)
  const [printJob, setPrintJob] = useState<JobWithDetails | null>(null)
  const [activeJobCount, setActiveJobCount] = useState(0)

  // Pre-fill state when launching "New Job for this Vehicle" from CRM
  const [prefillClient, setPrefillClient] = useState<Client | null>(null)
  const [prefillVehicle, setPrefillVehicle] = useState<Vehicle | null>(null)

  const isLoading = authLoading || garageLoading
  const showSubscription = user && (
    garage?.subscription_status === 'pending' ||
    garage?.subscription_status === 'expired'
  )

  function handleSignupSuccess() {
    fetchGarage()
  }

  function handleSubscriptionContinue() {
    fetchGarage()
  }

  function handleNavigate(page: AppPage) {
    setAppPage(page)
    if (page !== 'edit-job') setEditJobId(null)
    if (page !== 'new-job') {
      setPrefillClient(null)
      setPrefillVehicle(null)
    }
  }

  function handleEditJob(jobId: string) {
    setEditJobId(jobId)
    setPrefillClient(null)
    setPrefillVehicle(null)
    setAppPage('edit-job')
  }

  function handleNewJobForVehicle(client: Client, vehicle: Vehicle) {
    setPrefillClient(client)
    setPrefillVehicle(vehicle)
    setEditJobId(null)
    setAppPage('new-job')
  }

  function handleJobSuccess() {
    setAppPage('dashboard')
    setEditJobId(null)
    setPrefillClient(null)
    setPrefillVehicle(null)
  }

  function handlePrintJob(job: JobWithDetails) {
    setPrintJob(job)
  }

  function handleCloseInvoice() {
    setPrintJob(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup
        onSuccess={handleSignupSuccess}
        onSwitchToLogin={() => setAuthView('login')}
      />
    )
  }

  // Subscription gate
  if (showSubscription) {
    return <SubscriptionGate onContinue={handleSubscriptionContinue} />
  }

  // Garage profile missing — auth succeeded but no garages row exists.
  // Show the setup modal as an overlay on top of the loading screen.
  // The auto-insert in useGarage already tried once; this is the manual fallback UI.
  if (user && profileMissing && !garage) {
    return (
      <>
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
        <GarageSetupModal userId={user.id} onComplete={fetchGarage} />
      </>
    )
  }

  // Main app
  return (
    <AppLayout
      onNavigate={handleNavigate}
      currentPage={appPage}
      activeJobCount={activeJobCount}
    >
      {appPage === 'dashboard' && (
        <Dashboard
          onPrintJob={handlePrintJob}
          onEditJob={handleEditJob}
          onActiveJobCountChange={setActiveJobCount}
        />
      )}

      {appPage === 'crm' && (
        <ClientsView
          onNewJobForVehicle={handleNewJobForVehicle}
        />
      )}

      {appPage === 'finances' && (
        <FinancesView />
      )}

      {appPage === 'reminders' && (
        <ServiceReminders />
      )}

      {appPage === 'profile' && (
        <ProfileView />
      )}

      {appPage === 'new-job' && (
        <JobTicketForm
          initialClient={prefillClient}
          initialVehicle={prefillVehicle}
          onSuccess={handleJobSuccess}
          onCancel={() => setAppPage('dashboard')}
        />
      )}

      {appPage === 'edit-job' && editJobId && (
        <JobTicketForm
          editJobId={editJobId}
          onSuccess={handleJobSuccess}
          onCancel={() => setAppPage('dashboard')}
        />
      )}

      {printJob && (
        <InvoiceView job={printJob} onClose={handleCloseInvoice} />
      )}
    </AppLayout>
  )
}

export default App
