import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Books from './pages/Books';
import Events from './pages/Events';
import Quotes from './pages/Quotes';
import Join from './pages/Join';
import Auth from './pages/Auth';
import { AdminLayout, AdminLogin, Dashboard } from './pages/admin/Admin';
import { DataTools, ManageBooks, ManageCategories, ManageEvents, ManageMembers, ManageQuotes, ManageRequests, ManageUsers, Settings } from './pages/admin/Manage';
import ContentAdmin from './pages/admin/Content';
import { StoreProvider, useStore } from './lib/store';
import { ToastProvider } from './components/ui';

function Gate({ children }) {
  const { ready, loadError, api } = useStore();
  if (!ready) return <div className="splash"><img src="./emblem-t.png" alt="" /><p>جارٍ التحميل...</p></div>;
  return (
    <>
      {loadError && (
        <div className="load-error" role="alert">
          تعذر الاتصال بقاعدة البيانات: {loadError}
          <button className="btn btn-sm btn-line" onClick={api.refresh}>إعادة المحاولة</button>
        </div>
      )}
      {children}
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <Gate>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="books" element={<Books />} />
                <Route path="events" element={<Events />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="join" element={<Join />} />
                <Route path="login" element={<Auth />} />
                <Route path="register" element={<Auth />} />
                <Route path="admin/login" element={<AdminLogin />} />
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="content" element={<ContentAdmin />} />
                  <Route path="books" element={<ManageBooks />} />
                  <Route path="categories" element={<ManageCategories />} />
                  <Route path="events" element={<ManageEvents />} />
                  <Route path="members" element={<ManageMembers />} />
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="quotes" element={<ManageQuotes />} />
                  <Route path="requests" element={<ManageRequests />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="data" element={<DataTools />} />
                </Route>
                <Route path="*" element={<Home />} />
              </Route>
            </Routes>
          </HashRouter>
        </Gate>
      </StoreProvider>
    </ToastProvider>
  );
}
