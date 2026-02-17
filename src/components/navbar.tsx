import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// const navItems = ['Home', 'Search', 'Statistics', 'Developers', 'Help & FAQ'];

const navItems = {
    'Home': '/',
    'Search': '/search',
    'Chatbot': '/chatbot',
    'Statistics': '/statistics',
    'Developers': '/developers',
    'Help & FAQ': '/help'
}

export const Navbar = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: 'white', color: 'black', boxShadow: 'none' }}>
      <Toolbar style={{}}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          OpthaAtlas
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {Object.entries(navItems).map(([key, value]) => (
            <Button key={key} sx={{ color: 'black' }} href={value}>
              {key}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};