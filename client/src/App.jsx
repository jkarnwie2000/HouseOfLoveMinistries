import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import { Loading } from './components/ui/Feedback.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Ministries, { MinistryDetail } from './pages/Ministries.jsx';
import Events from './pages/Events.jsx';
import Contact from './pages/Contact.jsx';
import Give from './pages/Give.jsx';
import DonationThankYou from './pages/DonationThankYou.jsx';
import Store from './pages/store/Store.jsx';
import ProductDetail from './pages/store/ProductDetail.jsx';
import Cart from './pages/store/Cart.jsx';
import Checkout from './pages/store/Checkout.jsx';
import OrderConfirmation from './pages/store/OrderConfirmation.jsx';
import { Privacy, Terms } from './pages/Legal.jsx';
import NotFound from './pages/NotFound.jsx';

// The admin area is code-split so public visitors never download it.
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminRegister = lazy(() => import('./pages/admin/AdminRegister.jsx'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'));
const Categories = lazy(() => import('./pages/admin/Categories.jsx'));
const Orders = lazy(() => import('./pages/admin/Orders.jsx'));
const OrderDetail = lazy(() => import('./pages/admin/Orders.jsx').then((m) => ({ default: m.OrderDetail })));
const Donations = lazy(() => import('./pages/admin/Donations.jsx'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents.jsx'));
const Messages = lazy(() => import('./pages/admin/Messages.jsx'));
const Users = lazy(() => import('./pages/admin/Users.jsx'));

function AdminRoot() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="ministries" element={<Ministries />} />
        <Route path="ministries/:slug" element={<MinistryDetail />} />
        <Route path="events" element={<Events />} />
        <Route path="contact" element={<Contact />} />
        <Route path="give" element={<Give />} />
        <Route path="give/thank-you" element={<DonationThankYou />} />
        <Route path="store" element={<Store />} />
        <Route path="store/order-confirmation" element={<OrderConfirmation />} />
        <Route path="store/:productId" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="admin" element={<AdminRoot />}>
        <Route path="login" element={<AdminLogin />} />
        <Route path="register" element={<AdminRegister />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="donations" element={<Donations />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="messages" element={<Messages />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Route>
    </Routes>
  );
}
