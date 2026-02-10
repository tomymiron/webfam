import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Home, Login, Register, Athlete, Athletes, AthleteDetail, Clubs, ClubDetail, Meets, Meet, Inscriptions, Ranking, Results, ClubsRequest, CreateClub, ClubHome, ClubRequests, ClubAthletes, ClubMeets, ClubMeet, ClubTransfers, ClubInscriptions, ClubPrices, News, NewsDetail } from "./screens";
import { AuthProviderClub, useAuthClub } from "./contexts/AuthContextClub";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastContainer } from "material-react-toastify";
import { AnimatePresence } from "framer-motion";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentFailure from "./components/PaymentFailure";
import PaymentPending from "./components/PaymentPending";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderClub>
        <AuthProvider>
          <ToastContainer />
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </AuthProviderClub>
    </QueryClientProvider>
  );
}

const ClubRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ClubHome />} />
      <Route path="/requests" element={<ClubRequests />} />
      <Route path="/athletes" element={<ClubAthletes />} />
      <Route path="/meets" element={<ClubMeets />} />
      <Route path="/meet/:id" element={<ClubMeet />} />
      <Route path="/meet/:meetId/inscriptions" element={<ClubInscriptions />} />
      <Route path="/transfers" element={<ClubTransfers />} />
      <Route path="/prices" element={<ClubPrices />} />
    </Routes>
  );
};

function AppRoutes() {
    const location = useLocation();

    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<HandlerLogin component={<Login />} />} />
          <Route path="/register" element={<HandlerLogin component={<Register />} />} />

          <Route path="/meets" element={<Meets />} />
          <Route path="/meet/:id" element={<Meet />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/results" element={<Results />} />
          <Route path="/athletes" element={<Athletes />} />
          <Route path="/athlete/:id" element={<AthleteDetail />} />
          <Route path="/athlete" element={<ProtectedAthleteRoute component={<Athlete />} />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/club-detail/:id" element={<ClubDetail />} />
          <Route path="/inscriptions/:id" element={<Inscriptions />} />
          <Route path="/clubs/request" element={<ClubsRequest />} />
          <Route path="/clubs/create" element={<CreateClub />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/pending" element={<PaymentPending />} />

          <Route path="/club/*" element={<ProtectedClubRoute component={<ClubRoutes />} />} />

        </Routes>
      </AnimatePresence>
    );
}


function HandlerLogin({ component }) {
  const { authState } = useAuth();
  const { authState: clubAuthState } = useAuthClub();

  if (authState?.authenticated == null && clubAuthState?.authenticated == null) {
    return <div>Cargando...</div>;
  }
  
  if (authState?.authenticated) return <Navigate to="/athlete" />;
  if (clubAuthState?.authenticated) return <Navigate to="/club" />;
  
  return component;
}

function ProtectedAthleteRoute({ component }) {
  const { authState } = useAuth();

  if (authState?.authenticated == null) {
    return <div>Cargando...</div>;
  }
    
  return authState.authenticated ? component : <Navigate to="/login" />;
}

function ProtectedClubRoute({ component }) {
  const { authState } = useAuthClub();

  if (authState?.authenticated == null) {
    return <div>Cargando...</div>;
  }
    
  return authState.authenticated ? component : <Navigate to="/login" />;
}