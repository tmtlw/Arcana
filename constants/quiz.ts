
export interface QuickQuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    category?: string;
}

export const QUIZ_QUESTIONS: QuickQuizQuestion[] = [
    { id: 'q1', question: "Melyik elem tartozik a Botok sorozathoz?", options: ["Tűz", "Víz", "Levegő", "Föld"], correctAnswer: "Tűz" },
    { id: 'q2', question: "Melyik elem tartozik a Kelyhek sorozathoz?", options: ["Tűz", "Víz", "Levegő", "Föld"], correctAnswer: "Víz" },
    { id: 'q3', question: "Melyik elem tartozik a Kardok sorozathoz?", options: ["Tűz", "Víz", "Levegő", "Föld"], correctAnswer: "Levegő" },
    { id: 'q4', question: "Melyik elem tartozik az Érmék sorozathoz?", options: ["Tűz", "Víz", "Levegő", "Föld"], correctAnswer: "Föld" },
    { id: 'q5', question: "Melyik bolygó uralja a Mágus kártyát?", options: ["Merkúr", "Vénusz", "Mars", "Jupiter"], correctAnswer: "Merkúr" },
    { id: 'q6', question: "Melyik kártya jelenti a 'Nagy Sorsfordulatot'?", options: ["A Szerencsekerék", "A Világ", "A Torony", "A Halál"], correctAnswer: "A Szerencsekerék" },
    { id: 'q7', question: "Hány lapból áll a Nagy Árkánum?", options: ["21", "22", "56", "78"], correctAnswer: "22" },
    { id: 'q8', question: "Melyik kártya a 0. sorszámú?", options: ["A Bolond", "A Mágus", "A Világ", "Az Akasztott"], correctAnswer: "A Bolond" },
    { id: 'q9', question: "Melyik elem a 'Kardok Ásza'?", options: ["Levegő", "Tűz", "Víz", "Föld"], correctAnswer: "Levegő" },
    { id: 'q10', question: "Melyik kártya utal belső egyensúlyra?", options: ["Mértékletesség", "Az Erő", "Igazságosság", "Csillag"], correctAnswer: "Mértékletesség" },
    { id: 'q11', question: "Melyik sorozat utal az anyagi világra?", options: ["Érmék", "Botok", "Kelyhek", "Kardok"], correctAnswer: "Érmék" },
    { id: 'q12', question: "Melyik sorozat utal az érzelmekre?", options: ["Kelyhek", "Érmék", "Kardok", "Botok"], correctAnswer: "Kelyhek" },
    { id: 'q13', question: "Melyik sorozat utal az akaratra és tettekre?", options: ["Botok", "Kardok", "Kelyhek", "Érmék"], correctAnswer: "Botok" },
    { id: 'q14', question: "Melyik sorozat utal a gondolatokra?", options: ["Kardok", "Botok", "Érmék", "Kelyhek"], correctAnswer: "Kardok" },
    { id: 'q15', question: "Melyik kártya a 'Főpapnő' ellentéte a világi hatalomban?", options: ["A Császárnő", "A Nap", "Az Igazságosság", "A Csillag"], correctAnswer: "A Császárnő" },
    { id: 'q16', question: "Melyik zodiákus jegy tartozik az Erő kártyához?", options: ["Oroszlán", "Kos", "Skorpió", "Bika"], correctAnswer: "Oroszlán" },
    { id: 'q17', question: "Melyik kártya jelöli a lezárást és beteljesülést?", options: ["A Világ", "A Judélet", "A Nap", "A Csillag"], correctAnswer: "A Világ" },
    { id: 'q18', question: "Ki a Tarot 'tanítója' és a hit őrzője?", options: ["A Főpap", "A Remete", "A Mágus", "Az Uralkodó"], correctAnswer: "A Főpap" },
    { id: 'q19', question: "Melyik elem a 'Botok Nyolcas'?", options: ["Tűz", "Levegő", "Föld", "Víz"], correctAnswer: "Tűz" },
    { id: 'q20', question: "Melyik kártya jelenti a hirtelen változást?", options: ["A Torony", "A Halál", "Az Ördög", "A Hold"], correctAnswer: "A Torony" }
];
