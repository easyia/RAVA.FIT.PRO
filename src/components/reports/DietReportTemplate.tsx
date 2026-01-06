
import React from 'react';
import {
    Flame,
    Beef,
    Wheat,
    Droplets,
    Clock,
    CheckCircle2,
    Target,
    Activity
} from 'lucide-react';

// Print-optimized styles following EvolutionReportTemplate pattern
const styles = {
    page: {
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 20mm',
        backgroundColor: 'white',
        color: '#111827',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        lineHeight: 1.4,
        display: 'flex',
        flexDirection: 'column' as const,
    } as React.CSSProperties,
    header: {
        borderBottom: '3px solid #F59E0B',
        paddingBottom: '12px',
        marginBottom: '20px',
    } as React.CSSProperties,
    title: {
        fontSize: '24px',
        fontWeight: 900,
        color: '#F59E0B',
        margin: 0,
        fontStyle: 'italic',
        letterSpacing: '-1px',
    } as React.CSSProperties,
    subtitle: {
        fontSize: '9px',
        color: '#6B7280',
        letterSpacing: '3px',
        textTransform: 'uppercase' as const,
        marginTop: '4px',
        fontWeight: 700,
    } as React.CSSProperties,
    identityTable: {
        width: '100%',
        marginTop: '12px',
        borderCollapse: 'collapse' as const,
    } as React.CSSProperties,
    identityCell: {
        border: '1px solid #E5E7EB',
        padding: '8px 12px',
        textAlign: 'left' as const,
    } as React.CSSProperties,
    identityLabel: {
        fontSize: '9px',
        color: '#9CA3AF',
        textTransform: 'uppercase' as const,
        fontWeight: 700,
        display: 'block',
        marginBottom: '2px',
    } as React.CSSProperties,
    identityValue: {
        fontSize: '13px',
        fontWeight: 700,
        color: '#111827',
    } as React.CSSProperties,
    sectionTitle: {
        fontSize: '12px',
        fontWeight: 800,
        color: '#F59E0B',
        textTransform: 'uppercase' as const,
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '6px',
        marginBottom: '12px',
        marginTop: '24px',
    } as React.CSSProperties,
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
    } as React.CSSProperties,
    metricCard: {
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center' as const,
    } as React.CSSProperties,
    metricLabel: {
        fontSize: '9px',
        color: '#6B7280',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
    } as React.CSSProperties,
    metricValue: {
        fontSize: '22px',
        fontWeight: 800,
        margin: '4px 0 0 0',
    } as React.CSSProperties,
    metricUnit: {
        fontSize: '10px',
        fontWeight: 400,
        color: '#9CA3AF',
        marginLeft: '2px',
    } as React.CSSProperties,
    mealContainer: {
        marginBottom: '20px',
        border: '1px solid #F3F4F6',
        borderRadius: '10px',
        overflow: 'hidden',
    } as React.CSSProperties,
    mealHeader: {
        backgroundColor: '#F9FAFB',
        padding: '10px 15px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as React.CSSProperties,
    mealTitle: {
        fontSize: '12px',
        fontWeight: 800,
        color: '#111827',
        textTransform: 'uppercase' as const,
        margin: 0,
    } as React.CSSProperties,
    mealTime: {
        fontSize: '11px',
        fontWeight: 700,
        color: '#F59E0B',
    } as React.CSSProperties,
    mealBody: {
        padding: '10px 15px',
    } as React.CSSProperties,
    foodItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        borderBottom: '1px solid #F9FAFB',
    } as React.CSSProperties,
    parecerBox: {
        backgroundColor: '#FFFBEB',
        border: '1px solid #FDE68A',
        padding: '16px',
        borderRadius: '8px',
        fontStyle: 'italic',
        fontSize: '11px',
        color: '#78350F',
        lineHeight: 1.6,
        marginTop: '12px',
    } as React.CSSProperties,
    footer: {
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '2px solid #F3F4F6',
        textAlign: 'right' as const,
        fontSize: '10px',
        fontWeight: 700,
        color: '#9CA3AF',
        textTransform: 'uppercase' as const,
    } as React.CSSProperties,
};

interface DietReportTemplateProps {
    data: {
        student: any;
        plan: any;
        coach?: any;
    };
}

export const DietReportTemplate = ({ data }: DietReportTemplateProps) => {
    const { student, plan, coach } = data;
    const today = new Date().toLocaleDateString('pt-BR');

    // Grouping meals to avoid repetition if they are options
    // Actually, in the current data structure, each option is a separate meal entry.
    // Let's group them by time and name to display them more elegantly
    const groupedMeals: Record<string, any[]> = {};
    plan?.meals?.forEach((meal: any) => {
        const key = `${meal.meal_time}-${meal.name}`;
        if (!groupedMeals[key]) groupedMeals[key] = [];
        groupedMeals[key].push(meal);
    });

    return (
        <div className="report-container">
            <div className="print-page" style={styles.page}>
                {/* HEADER */}
                <div style={styles.header}>
                    <h1 style={styles.title}>RAVA FIT PRO</h1>
                    <p style={styles.subtitle}>Nutritional Planning & Performance</p>

                    {/* Identity Table */}
                    <table style={styles.identityTable}>
                        <tbody>
                            <tr>
                                <td style={{ ...styles.identityCell, width: '40%' }}>
                                    <span style={styles.identityLabel}>Objetivo</span>
                                    <span style={styles.identityValue}>{plan?.goal || student?.goal || 'Hipertrofia'}</span>
                                </td>
                                <td style={{ ...styles.identityCell, width: '35%' }}>
                                    <span style={styles.identityLabel}>Aluno</span>
                                    <span style={styles.identityValue}>{student?.full_name || student?.name || 'Aluno'}</span>
                                </td>
                                <td style={{ ...styles.identityCell, width: '25%' }}>
                                    <span style={styles.identityLabel}>Emissão</span>
                                    <span style={styles.identityValue}>{today}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ESTRATÉGIA ATUAL */}
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ ...styles.sectionTitle, marginTop: 0 }}>Estratégia: {plan?.title}</h2>
                </div>

                {/* MACRONUTRIENTES */}
                <div style={styles.metricsGrid}>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>Calorias</span>
                        <p style={{ ...styles.metricValue, color: '#111827' }}>
                            {plan?.total_calories ?? '-'} <span style={styles.metricUnit}>kcal</span>
                        </p>
                    </div>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>Proteína</span>
                        <p style={{ ...styles.metricValue, color: '#EF4444' }}>
                            {plan?.total_proteins ?? '-'} <span style={styles.metricUnit}>g</span>
                        </p>
                    </div>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>Carbo</span>
                        <p style={{ ...styles.metricValue, color: '#F59E0B' }}>
                            {plan?.total_carbs ?? '-'} <span style={styles.metricUnit}>g</span>
                        </p>
                    </div>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>Gordura</span>
                        <p style={{ ...styles.metricValue, color: '#3B82F6' }}>
                            {plan?.total_fats ?? '-'} <span style={styles.metricUnit}>g</span>
                        </p>
                    </div>
                </div>

                {/* CRONOGRAMA DE REFEIÇÕES */}
                <h2 style={styles.sectionTitle}>Cronograma de Refeições</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {Object.entries(groupedMeals).map(([key, meals], idx) => (
                        <div key={key} style={styles.mealContainer}>
                            <div style={styles.mealHeader}>
                                <h3 style={styles.mealTitle}>{meals[0].name}</h3>
                                <span style={styles.mealTime}>{meals[0].meal_time}</span>
                            </div>
                            <div style={styles.mealBody}>
                                {meals.map((option, optIdx) => (
                                    <div key={optIdx} style={{ marginBottom: meals.length > 1 ? '15px' : '0' }}>
                                        {meals.length > 1 && (
                                            <p style={{ fontSize: '9px', fontWeight: 900, color: '#6B7280', marginBottom: '5px', textTransform: 'uppercase' }}>
                                                OPÇÃO {optIdx + 1}
                                            </p>
                                        )}
                                        {option.meal_foods?.map((food: any, fIdx: number) => (
                                            <div key={fIdx} style={styles.foodItem}>
                                                <span style={{ color: '#4B5563' }}>• {food.name} <span style={{ fontSize: '9px', fontStyle: 'italic', color: '#9CA3AF' }}>{food.notes ? `(${food.notes})` : ''}</span></span>
                                                <span style={{ fontWeight: 700 }}>{food.quantity} {food.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* OBSERVAÇÕES TÉCNICAS */}
                <div style={{ marginTop: 'auto' }}>
                    <h2 style={{ ...styles.sectionTitle, marginTop: '20px' }}>Orientações do Coach</h2>
                    <div style={styles.parecerBox}>
                        O consumo de água deve ser de, no mínimo, 35ml por kg de peso corporal.
                        As substituições devem seguir a tabela de equivalentes enviada via chat.
                        Mantenha o fracionamento das refeições conforme os horários sugeridos para otimizar a síntese proteica.
                    </div>

                    <footer style={styles.footer}>
                        Coach {coach?.full_name || 'RAVA Personal'} — Excellence in Performance
                    </footer>
                </div>
            </div>
        </div>
    );
};
