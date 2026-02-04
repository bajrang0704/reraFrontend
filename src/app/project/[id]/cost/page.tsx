"use client";

import { use } from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function ProjectCostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Add Project Cost</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Project Cost details form will be implemented here.</Typography>
                <Typography variant="caption">Project ID: {decodeURIComponent(id)}</Typography>
            </Paper>
        </Box>
    );
}
