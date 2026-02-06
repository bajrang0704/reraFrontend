import MainLayout from "@/components/layout/MainLayout";

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}
