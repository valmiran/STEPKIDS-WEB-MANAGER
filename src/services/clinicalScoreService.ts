type ClinicalAnalysisInput = {
  usageCount: number;
  checklistCount: number;
  symptomCount: number;
  totalHours: number;
};

export type ClinicalAnalysisResult = {
  score: number;

  risk:
    | 'Baixo'
    | 'Moderado'
    | 'Alto';

  color:
    | 'success'
    | 'warning'
    | 'danger';

  alerts: string[];

  summary: string;
};

export const clinicalScoreService = {
  analyze({
    usageCount,
    checklistCount,
    symptomCount,
    totalHours,
  }: ClinicalAnalysisInput): ClinicalAnalysisResult {
    let score = 0;

    const alerts: string[] = [];

    // USO DA ÓRTESE
    if (usageCount >= 7) {
      score += 40;
    } else if (usageCount >= 4) {
      score += 25;

      alerts.push('Uso parcial da órtese');
    } else {
      score += 10;

      alerts.push('Baixa adesão ao uso da órtese');
    }

    // CHECKLISTS
    if (checklistCount >= 7) {
      score += 20;
    } else if (checklistCount >= 4) {
      score += 10;

      alerts.push('Checklists incompletos');
    } else {
      alerts.push('Poucos registros clínicos');
    }

    // SINTOMAS
    if (symptomCount === 0) {
      score += 30;
    } else if (symptomCount <= 2) {
      score += 15;

      alerts.push('Sintomas leves registrados');
    } else {
      alerts.push('Muitos sintomas registrados');
    }

    // HORAS TOTAIS
    if (totalHours >= 56) {
      score += 10;
    } else if (totalHours >= 28) {
      score += 5;

      alerts.push('Tempo de uso moderado');
    } else {
      alerts.push('Tempo insuficiente de uso');
    }

    // CLASSIFICAÇÃO
    if (score >= 80) {
      return {
        score,
        risk: 'Baixo',
        color: 'success',
        alerts,
        summary:
          'Boa adesão ao tratamento com baixo risco clínico.',
      };
    }

    if (score >= 50) {
      return {
        score,
        risk: 'Moderado',
        color: 'warning',
        alerts,
        summary:
          'Acompanhamento recomendado para evitar baixa adesão.',
      };
    }

    return {
      score,
      risk: 'Alto',
      color: 'danger',
      alerts,
      summary:
        'Paciente com risco elevado de baixa adesão ao tratamento.',
    };
  },
};