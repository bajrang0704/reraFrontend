"use client";

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Avatar,
    Divider,
    useTheme,
    useMediaQuery,
    Collapse,
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileApi } from '@/lib/api/profile';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import PaymentIcon from '@mui/icons-material/Payment';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupIcon from '@mui/icons-material/Group';
import DomainIcon from '@mui/icons-material/Domain';
import DeckIcon from '@mui/icons-material/Deck';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EngineeringIcon from '@mui/icons-material/Engineering';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GavelIcon from '@mui/icons-material/Gavel';
import TaskIcon from '@mui/icons-material/Task';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import UpdateIcon from '@mui/icons-material/Update';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LogoutIcon from '@mui/icons-material/Logout';
import DownloadIcon from '@mui/icons-material/Download';

const drawerWidth = 280;

interface SidebarProps {
    mobileOpen: boolean;
    handleDrawerToggle: () => void;
}

interface MenuItem {
    text: string;
    icon: React.ReactNode;
    path?: string;
    children?: MenuItem[];
}

const Sidebar = ({ mobileOpen, handleDrawerToggle }: SidebarProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
        'Account': true,
        'Project Details': true,
    });

    const handleSubmenuClick = (text: string) => {
        setOpenSubmenus((prev) => ({
            ...prev,
            [text]: !prev[text],
        }));
    };

    // State to track if org-members should be shown
    const [showOrgMembers, setShowOrgMembers] = useState(false);

    useEffect(() => {
        if (user?.loginId) {
            profileApi.getProfile(user.loginId)
                .then(res => {
                    console.log("Sidebar profile response:", res);
                    const p = (res as any).data || res.profile;
                    console.log("Sidebar profile object:", p);
                    if (p) {
                        const profileType = p.profileType || p.informationType || p.infoType;
                        const entityType = p.entityType || p.organizationType || p.orgType;
                        const orgDetails = p.organizationDetails;
                        const nestedEntityType = orgDetails?.entityType || orgDetails?.organizationType;

                        console.log("Sidebar check:", { profileType, entityType, orgDetails, nestedEntityType });

                        const isOtherThanIndividual = profileType === "OTHER_THAN_INDIVIDUAL" || profileType === "ORGANIZATION";
                        const isOthersType = entityType === "OTHERS" || nestedEntityType === "OTHERS";

                        console.log("Sidebar result:", { isOtherThanIndividual, isOthersType, showOrgMembers: isOtherThanIndividual && isOthersType });
                        setShowOrgMembers(isOtherThanIndividual && isOthersType);
                    } else {
                        setShowOrgMembers(false);
                    }
                })
                .catch(() => setShowOrgMembers(false));
        }
    }, [user?.loginId]);

    const handleItemClick = (item: MenuItem) => {
        if (item.children) {
            handleSubmenuClick(item.text);
        } else if (item.path) {
            if (item.path === '/logout') {
                logout();
            } else {
                router.push(item.path);
                if (isMobile) {
                    handleDrawerToggle();
                }
            }
        }
    };

    // Get the encoded project ID for navigation
    const projectId = user?.loginId || user?.id || '';
    const encodedProjectId = encodeURIComponent(projectId);

    const baseMenuItems: MenuItem[] = [
        {
            text: 'Account',
            icon: <AccountCircleIcon />,
            children: [
                { text: 'My Profile', icon: <PersonIcon />, path: '/account/profile' },
                { text: 'Add Organizations Other Member Details', icon: <BusinessIcon />, path: '/account/org-members' },
                { text: 'Past Experience Details', icon: <HistoryIcon />, path: '/account/past-experience' },
            ],
        },
        {
            text: 'Project Details',
            icon: <BusinessIcon />,
            children: [
                { text: 'Add Project', icon: <ApartmentIcon />, path: `/project/${encodedProjectId}/add` },
                { text: 'Add Co-Promoter Details', icon: <GroupIcon />, path: `/project/${encodedProjectId}/co-promoter` },
                { text: 'Add Buildings', icon: <DomainIcon />, path: `/project/${encodedProjectId}/buildings` },
                { text: 'Common Areas and Facilities', icon: <DeckIcon />, path: `/project/${encodedProjectId}/common-areas` },
                { text: 'Add Project Cost', icon: <MonetizationOnIcon />, path: `/project/${encodedProjectId}/cost` },
                { text: 'Add Project Professional Details', icon: <EngineeringIcon />, path: `/project/${encodedProjectId}/professional` },
                { text: 'Document Upload', icon: <UploadFileIcon />, path: `/project/${encodedProjectId}/documents` },
                { text: 'Add Litigations Related to the Project', icon: <GavelIcon />, path: `/project/${encodedProjectId}/litigations` },
                { text: 'Task/Activity', icon: <TaskIcon />, path: `/project/${encodedProjectId}/activity` },
                { text: 'Upload Photos', icon: <PhotoCameraIcon />, path: `/project/${encodedProjectId}/photos` },
                { text: 'Application Withdrawal', icon: <CancelIcon />, path: `/project/${encodedProjectId}/withdrawal` },
                { text: 'Application For Change', icon: <EditIcon />, path: `/project/${encodedProjectId}/change` },
            ],
        },
        { text: 'Payment', icon: <PaymentIcon />, path: '/payment' },
        { text: 'Project Extension', icon: <UpdateIcon />, path: `/project/${encodedProjectId}/extension` },
        { text: 'Download Payment Receipts', icon: <DownloadIcon />, path: '/payment/receipts' },
        { text: 'Quarterly Update', icon: <UpdateIcon />, path: '/update/quarterly' },
        { text: 'Annual Audit Report', icon: <AssessmentIcon />, path: '/update/audit' },
        { text: 'Overall completion certificate upload', icon: <VerifiedUserIcon />, path: '/update/completion' },
        { text: 'Log Out', icon: <LogoutIcon />, path: '/logout' },
    ];

    // Filter out org-members if not applicable
    const menuItems = useMemo(() => {
        return baseMenuItems.map(item => {
            if (item.text === 'Account' && item.children) {
                return {
                    ...item,
                    children: item.children.filter(child => {
                        if (child.path === '/account/org-members') {
                            return showOrgMembers;
                        }
                        return true;
                    })
                };
            }
            return item;
        });
    }, [showOrgMembers, encodedProjectId]);

    const isActive = (path?: string) => {
        if (!path) return false;
        return pathname === path || pathname.startsWith(path + '/');
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1a1a2e', color: 'white' }}>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#16213e' }}>
                <Avatar
                    sx={{ width: 80, height: 80, mb: 2, bgcolor: theme.palette.primary.main }}
                    alt={user?.name || "Promoter"}
                >
                    {user?.name?.charAt(0) || 'P'}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold">
                    Welcome,
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.light">
                    {user?.name || 'TEMP'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'gray' }}>
                    Promoter
                </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {menuItems.map((item) => (
                    <Box key={item.text}>
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => handleItemClick(item)}
                                selected={item.path ? isActive(item.path) : false}
                                sx={{
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                    py: 1.5,
                                    bgcolor: item.path && isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                                }}
                            >
                                <ListItemIcon sx={{ color: 'gray', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 600 }}
                                />
                                {item.children ? (openSubmenus[item.text] ? <ExpandLess sx={{ color: 'gray' }} /> : <ExpandMore sx={{ color: 'gray' }} />) : null}
                            </ListItemButton>
                        </ListItem>

                        {item.children && (
                            <Collapse in={openSubmenus[item.text]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {item.children.map((child, index) => (
                                        <ListItemButton
                                            key={child.text}
                                            onClick={() => handleItemClick(child)}
                                            selected={isActive(child.path)}
                                            sx={{
                                                pl: 4,
                                                py: 1,
                                                position: 'relative',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                                '&.Mui-selected': {
                                                    bgcolor: 'rgba(79, 70, 229, 0.2)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(79, 70, 229, 0.3)',
                                                    }
                                                },
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    left: '28px',
                                                    top: 0,
                                                    bottom: 0,
                                                    width: '2px',
                                                    bgcolor: 'rgba(255,255,255,0.1)',
                                                    display: index === item.children!.length - 1 ? 'none' : 'block'
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: isActive(child.path) ? theme.palette.primary.light : 'gray', minWidth: 35 }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isActive(child.path) ? theme.palette.primary.light : 'gray', ml: 0.5 }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={child.text}
                                                primaryTypographyProps={{ fontSize: '0.85rem', color: isActive(child.path) ? 'white' : 'rgba(255,255,255,0.7)' }}
                                            />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                    </Box>
                ))}
            </List>
            <Box sx={{ p: 2, bgcolor: '#0f3460' }}>
                <Typography variant="caption" display="block" align="center" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    RERA Portal v1.0
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            )}
        </Box>
    );
};

export default Sidebar;
