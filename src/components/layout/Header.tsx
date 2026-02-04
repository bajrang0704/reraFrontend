"use client";

import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

interface HeaderProps {
    handleDrawerToggle: () => void;
    drawerWidth: number;
}

const Header = ({ handleDrawerToggle, drawerWidth }: HeaderProps) => {
    return (
        <AppBar
            position="fixed"
            sx={{
                width: { md: `calc(100% - ${drawerWidth}px)` },
                ml: { md: `${drawerWidth}px` },
                bgcolor: 'white',
                color: 'text.primary',
                boxShadow: 1,
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { md: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        TSRERA
                    </Typography>
                    <Typography variant="body2" noWrap component="div" sx={{ color: 'text.secondary' }}>
                        Telangana Real Estate Regulatory Authority
                    </Typography>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
