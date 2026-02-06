"use client";

import { use } from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function ChangePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Application For Change</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Application for change functionality will be implemented here.</Typography>
                <Typography variant="caption">Project ID: {decodeURIComponent(id)}</Typography>
            </Paper>
        </Box>
    );
}
