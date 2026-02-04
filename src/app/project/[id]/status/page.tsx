"use client";

import { use, useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { api } from "@/lib/api";
import { ProjectStatus } from "@/types/projectStatus";

interface ProjectStatusPageProps {
    params: Promise<{ id: string }>;
}

export default function ProjectStatusPage(props: ProjectStatusPageProps) {
    const params = use(props.params);
    const projectId = decodeURIComponent(params.id);

    const [project, setProject] = useState<ProjectStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setLoading(true);
                const response = await api.getProjectStatus(projectId);
                setProject(response.project);
            } catch (err: any) {
                console.error('Failed to load project status:', err);
                setError(err.response?.data?.message || 'Failed to load project status');
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [projectId]);

    const getStatusColor = (status: string): "default" | "warning" | "success" | "error" | "info" => {
        const upperStatus = status.toUpperCase();
        if (upperStatus.includes('PENDING') || upperStatus.includes('UNDER')) return 'warning';
        if (upperStatus.includes('APPROVED') || upperStatus.includes('PAID') || upperStatus.includes('COMPLETED')) return 'success';
        if (upperStatus.includes('REJECTED') || upperStatus.includes('FAILED')) return 'error';
        return 'default';
    };

    const formatStatus = (status: string) => {
        if (!status) return 'Not Submitted';
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ width: '100%', pb: 5 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!project) {
        return (
            <Box sx={{ width: '100%', pb: 5 }}>
                <Alert severity="info">No project data available</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', pb: 5 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
                Status
            </Typography>

            <Paper elevation={2} sx={{ overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#2c3e50' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Project Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Application Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Payment Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Scrutiny Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Correction Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Certificate / Application Preview</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Extension Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Extension Certificate</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell sx={{ py: 2 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {project.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {project.id}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Chip
                                        label={formatStatus(project.applicationStatus)}
                                        color={getStatusColor(project.applicationStatus)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Chip
                                        label={formatStatus(project.paymentStatus)}
                                        color={getStatusColor(project.paymentStatus)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatStatus(project.scrutinyStatus)}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatStatus(project.correctionStatus)}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {project.certificateUrl && (
                                            <Tooltip title="Download Certificate">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => window.open(project.certificateUrl!, '_blank')}
                                                >
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {project.applicationPreviewUrl && (
                                            <Tooltip title="Preview Application">
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => window.open(project.applicationPreviewUrl!, '_blank')}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {!project.certificateUrl && !project.applicationPreviewUrl && (
                                            <Typography variant="caption" color="text.disabled">
                                                -
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    {project.extensionStatus ? (
                                        <Typography variant="body2" color="text.secondary">
                                            {formatStatus(project.extensionStatus)}
                                        </Typography>
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">
                                            -
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    {project.extensionCertificateUrl ? (
                                        <Tooltip title="Download Extension Certificate">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => window.open(project.extensionCertificateUrl!, '_blank')}
                                            >
                                                <DownloadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">
                                            -
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
