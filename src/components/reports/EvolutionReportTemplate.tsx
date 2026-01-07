
import React from 'react';
import { EvolutionReportData } from '@/services/pdfService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

// Print-optimized styles
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
        fontSize: '24px',
        fontWeight: 800,
        margin: '4px 0 0 0',
    } as React.CSSProperties,
    metricUnit: {
        fontSize: '11px',
        fontWeight: 400,
        color: '#9CA3AF',
    } as React.CSSProperties,
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '11px',
    } as React.CSSProperties,
    th: {
        backgroundColor: '#F3F4F6',
        borderBottom: '2px solid #111827',
        padding: '8px',
        textAlign: 'left' as const,
        fontWeight: 700,
        fontSize: '10px',
        textTransform: 'uppercase' as const,
    } as React.CSSProperties,
    td: {
        borderBottom: '1px solid #E5E7EB',
        padding: '6px 8px',
    } as React.CSSProperties,
    diffPositive: { color: '#10B981', fontWeight: 700 } as React.CSSProperties,
    diffNegative: { color: '#EF4444', fontWeight: 700 } as React.CSSProperties,
    diffNeutral: { color: '#9CA3AF' } as React.CSSProperties,
    chartContainer: {
        height: '120px',
        marginTop: '16px',
    } as React.CSSProperties,
    footer: {
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '2px solid #F3F4F6',
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
    } as React.CSSProperties,
    signature: {
        textAlign: 'right' as const,
        marginTop: '16px',
        fontSize: '11px',
        fontWeight: 800,
        color: '#111827',
    } as React.CSSProperties,
};

export const EvolutionReportTemplate = ({ data }: { data: EvolutionReportData }) => {
    const { student, coach, assessments, feedbacks } = data;

    // Sort by date ascending for charts, keep original for latest/prev
    const sortedAssessments = [...(assessments || [])].sort(
        (a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
    );
    const latestAssessment = sortedAssessments[sortedAssessments.length - 1];
    const prevAssessment = sortedAssessments.length > 1 ? sortedAssessments[sortedAssessments.length - 2] : null;

    // Chart data
    const chartsData = sortedAssessments.map(a => ({
        date: new Date(a.assessment_date).toLocaleDateString('pt-BR').slice(0, 5),
        peso: a.weight,
        gordura: a.body_fat,
    }));

    // Helper for difference display
    const getDiff = (curr: number | null | undefined, prev: number | null | undefined) => {
        const c = curr ?? 0;
        const p = prev ?? 0;
        const diff = c - p;
        if (diff === 0 || !prev) return { value: '-', style: styles.diffNeutral };
        return {
            value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`,
            style: diff > 0 ? styles.diffPositive : styles.diffNegative,
        };
    };

    // Perimetry data mapping
    const perimetryRows = [
        { label: 'Tórax', key: 'chest' },
        { label: 'Cintura', key: 'waist' },
        { label: 'Quadril', key: 'hip' },
        { label: 'Abdômen', key: 'abdomen' },
        { label: 'Braço D. (Cont.)', key: 'arm_right_contracted' },
        { label: 'Braço E. (Cont.)', key: 'arm_left_contracted' },
        { label: 'Coxa D. (Med.)', key: 'thigh_right_medial' },
        { label: 'Coxa E. (Med.)', key: 'thigh_left_medial' },
        { label: 'Panturrilha D.', key: 'calf_right' },
        { label: 'Panturrilha E.', key: 'calf_left' },
    ];

    // Skinfolds data mapping
    const skinfoldsRows = [
        { label: 'Abdominal', key: 'abdominal_fold' },
        { label: 'Supra-ilíaca', key: 'suprailiac_fold' },
        { label: 'Tricipital', key: 'triceps_fold' },
        { label: 'Subescapular', key: 'subscapular_fold' },
    ];

    // Feedback averages
    const avgSleep = feedbacks && feedbacks.length
        ? (feedbacks.reduce((acc, f) => acc + (f.sleep_quality || 0), 0) / feedbacks.length).toFixed(1)
        : 'N/A';
    const avgFatigue = feedbacks && feedbacks.length
        ? (feedbacks.reduce((acc, f) => acc + (f.fatigue_level || 0), 0) / feedbacks.length).toFixed(1)
        : 'N/A';

    // Goal from student anamnesis if available
    const goal = student?.anamnesis?.[0]?.main_goal || student?.goal || 'Condicionamento';

    return (
        <div className="report-container">
            {/* PAGE 1 */}
            <div className="print-page" style={styles.page}>
                {/* HEADER */}
                <div style={styles.header}>
                    <h1 style={styles.title}>FIT PRO</h1>
                    <p style={styles.subtitle}>Performance & Evolution Tracking</p>

                    {/* Identity Table */}
                    <table style={styles.identityTable}>
                        <tbody>
                            <tr>
                                <td style={{ ...styles.identityCell, width: '40%' }}>
                                    <span style={styles.identityLabel}>Objetivo</span>
                                    <span style={styles.identityValue}>{goal}</span>
                                </td>
                                <td style={{ ...styles.identityCell, width: '35%' }}>
                                    <span style={styles.identityLabel}>Aluno</span>
                                    <span style={styles.identityValue}>{student?.full_name || student?.name || 'Aluno'}</span>
                                </td>
                                <td style={{ ...styles.identityCell, width: '25%' }}>
                                    <span style={styles.identityLabel}>Data da Avaliação</span>
                                    <span style={styles.identityValue}>
                                        {latestAssessment ? new Date(latestAssessment.assessment_date).toLocaleDateString('pt-BR') : '-'}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* COMPOSIÇÃO CORPORAL */}
                <h2 style={styles.sectionTitle}>Composição Corporal</h2>
                <div style={styles.metricsGrid}>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>Peso</span>
                        <p style={{ ...styles.metricValue, color: '#111827' }}>
                            {latestAssessment?.weight ?? '-'}<span style={styles.metricUnit}>kg</span>
                        </p>
                    </div>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>% Gordura</span>
                        <p style={{ ...styles.metricValue, color: '#EF4444' }}>
                            {latestAssessment?.body_fat ?? '-'}<span style={styles.metricUnit}>%</span>
                        </p>
                    </div>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>Massa Magra</span>
                        <p style={{ ...styles.metricValue, color: '#10B981' }}>
                            {latestAssessment?.muscle_mass ?? '-'}<span style={styles.metricUnit}>kg</span>
                        </p>
                    </div>
                    <div style={styles.metricCard}>
                        <span style={styles.metricLabel}>IMC</span>
                        <p style={{ ...styles.metricValue, color: '#111827' }}>
                            {latestAssessment?.bmi ?? '-'}
                        </p>
                    </div>
                </div>

                {/* PERIMETRIA */}
                <h2 style={styles.sectionTitle}>Perimetria (cm)</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Medida</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>
                                Anterior {prevAssessment ? `(${new Date(prevAssessment.assessment_date).toLocaleDateString('pt-BR')})` : ''}
                            </th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>
                                Atual {latestAssessment ? `(${new Date(latestAssessment.assessment_date).toLocaleDateString('pt-BR')})` : ''}
                            </th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Diferença</th>
                        </tr>
                    </thead>
                    <tbody>
                        {perimetryRows.map((row, idx) => {
                            const curr = latestAssessment?.[row.key];
                            const prev = prevAssessment?.[row.key];
                            const diff = getDiff(curr, prev);
                            return (
                                <tr key={idx}>
                                    <td style={styles.td}>{row.label}</td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>{prev ?? '-'}</td>
                                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700 }}>{curr ?? '-'}</td>
                                    <td style={{ ...styles.td, textAlign: 'center', ...diff.style }}>{diff.value}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* DOBRAS CUTÂNEAS */}
                <h2 style={styles.sectionTitle}>Dobras Cutâneas (mm)</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Dobra</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Anterior</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Atual</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Diferença</th>
                        </tr>
                    </thead>
                    <tbody>
                        {skinfoldsRows.map((row, idx) => {
                            const curr = latestAssessment?.[row.key];
                            const prev = prevAssessment?.[row.key];
                            const diff = getDiff(curr, prev);
                            return (
                                <tr key={idx}>
                                    <td style={styles.td}>{row.label}</td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>{prev ?? '-'}</td>
                                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700 }}>{curr ?? '-'}</td>
                                    <td style={{ ...styles.td, textAlign: 'center', ...diff.style }}>{diff.value}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* GRÁFICOS COMPACTOS */}
                <h2 style={styles.sectionTitle}>Evolução (Suporte Visual)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={styles.chartContainer}>
                        <p style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px', color: '#6B7280' }}>PESO (KG)</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                                <Line isAnimationActive={false} type="monotone" dataKey="peso" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={styles.chartContainer}>
                        <p style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px', color: '#6B7280' }}>% GORDURA</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                                <Line isAnimationActive={false} type="monotone" dataKey="gordura" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PARECER TÉCNICO & FOOTER */}
                <div style={styles.footer}>
                    <h2 style={{ ...styles.sectionTitle, marginTop: 0 }}>Parecer Técnico</h2>
                    <div style={styles.parecerBox}>
                        {latestAssessment?.ai_analysis_summary ||
                            latestAssessment?.postural_notes ||
                            latestAssessment?.general_notes ||
                            'Nenhuma observação registrada para este período. O aluno segue em evolução conforme o planejado.'}
                    </div>
                    <p style={styles.signature}>FIT PRO - THE NEW STANDARD</p>
                </div>
            </div>
        </div>
    );
};
