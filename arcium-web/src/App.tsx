import { Route, Switch, Redirect } from 'wouter';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Swap from './pages/Swap';
import Send from './pages/Send';
import Receive from './pages/Receive';
import CreateWallet from './pages/CreateWallet';
import ConfirmWallet from './pages/ConfirmWallet';
import Profile from './pages/Profile';
import ImportWallet from './pages/ImportWallet';
import Settings from './pages/Settings';

import { WalletProvider } from './context/WalletContext';

function App() {
  return (
    <Layout>
      <WalletProvider>
        <Switch>
          <Route path="/" component={Welcome} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/activity" component={Activity} />
          <Route path="/swap" component={Swap} />
          <Route path="/send" component={Send} />
          <Route path="/receive" component={Receive} />
          <Route path="/profile" component={Profile} />
          <Route path="/import-wallet" component={ImportWallet} />
          <Route path="/create-wallet" component={CreateWallet} />
          <Route path="/confirm-wallet" component={ConfirmWallet} />
          <Route path="/settings" component={Settings} />
          {/* Default redirect to welcome or dashboard */}
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </WalletProvider>
    </Layout>
  );
}

export default App;
