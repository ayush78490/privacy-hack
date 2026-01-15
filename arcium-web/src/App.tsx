import { Route, Switch, Redirect, Link } from 'wouter';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Swap from './pages/Swap';
import Send from './pages/Send';
import CreateWallet from './pages/CreateWallet';
import ConfirmWallet from './pages/ConfirmWallet';
import Profile from './pages/Profile';
import ImportWallet from './pages/ImportWallet';

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/activity" component={Activity} />
        <Route path="/swap" component={Swap} />
        <Route path="/send" component={Send} />
        <Route path="/profile" component={Profile} />
        <Route path="/import-wallet" component={ImportWallet} />
        <Route path="/create-wallet" component={CreateWallet} />
        <Route path="/confirm-wallet" component={ConfirmWallet} />
        <Route path="/settings">
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-slate-400">Settings page coming soon...</p>
            <Link
              href="/dashboard"
              className="mt-4 px-6 py-2 bg-primary rounded-lg text-white font-bold inline-block"
            >
              Back to Home
            </Link>
          </div>
        </Route>
        {/* Default redirect to welcome or dashboard */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Layout>
  );
}

export default App;
