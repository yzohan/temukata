import type { Lesson, StudentAttempt } from '../types';
import { buildLocalLeaderboard } from './leaderboard';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

const L1_BODY = `Kebersihan sungai memegang peranan krusial bagi keberlangsungan ekosistem dan kesehatan masyarakat di sekitarnya. Gagasan utama dari pengelolaan sungai yang berkelanjutan adalah mencegah masuknya limbah industri dan sampah rumah tangga langsung ke aliran air. Ketika masyarakat membuang sampah plastik sembarangan, aliran sungai akan tersumbat sehingga memicu bencana banjir bandang saat musim hujan tiba. Selain menyebabkan banjir, air sungai yang tercemar bahan kimia berbahaya akan mematikan ikan dan merusak rantai makanan alami. Oleh karena itu, gerakan gotong royong membersihkan bantaran sungai setiap akhir pekan menjadi langkah nyata yang sangat efektif. Kesadaran kolektif warga untuk tidak mengotori sungai merupakan kunci utama terciptanya lingkungan hidup yang lestari dan asri bagi generasi penerus bangsa.`;

const L2_BODY = `Hutan mangrove di pesisir utara Pulau Jawa memiliki fungsi ekologis sebagai benteng alami penahan abrasi ombak laut. Data dari Kementerian Lingkungan Hidup mencatat bahwa lebih dari lima puluh ribu hektare kawasan mangrove telah berhasil direhabilitasi sepanjang tahun lalu. Menurut pandangan beberapa aktivis lingkungan, penanaman kembali bibit bakau merupakan cara paling mulia dan paling sempurna untuk menyelamatkan bumi dari kehancuran iklim global. Secara ilmiah, akar tunjang pohon bakau yang rapat terbukti efektif memperlambat laju gelombang pasang dan mengendapkan lumpur di muara sungai. Sebagian wisatawan berpendapat bahwa hutan mangrove adalah tempat wisata alam yang paling menenangkan jiwa dibandingkan destinasi wisata lainnya. Namun, fakta di lapangan menunjukkan bahwa perusakan tambak liar tetap menjadi ancaman serius bagi kelangsungan ekosistem pesisir.`;

const L3_BODY = `Di tepi hutan yang lebat, seekor semut merah tergelincir jatuh ke dalam aliran sungai yang berarus deras saat sedang mencari makanan. Melihat semut merah yang megap-megap kepayahan, seekor burung pipit yang berhati dermawan segera memetik sehelai daun kering lalu menjatuhkannya ke dekat semut. Semut merah merayap naik ke atas daun tersebut sehingga selamat dari bahaya tenggelam menuju tepi sungai. Beberapa hari kemudian, seorang pemburu burung datang mengendap-endap dengan senapan angin yang diarahkan tepat ke dahan tempat burung pipit bertengger santai. Menyadari bahaya maut mengancam sahabatnya, semut merah tanpa ragu berlari kencang menggigit kaki pemburu sekuat tenaga hingga pemburu berteriak kesakitan dan tembakannya meleset jauh. Burung pipit pun berhasil terbang melarikan diri, membuktikan bahwa sekecil apa pun pertolongan yang tulus pasti akan menuai kebaikan yang setimpal.`;

const L4_BODY = `Pelangi adalah fenomena optik menakjubkan yang terjadi akibat pembiasan, pemantulan, dan penguraian cahaya matahari oleh tetesan air hujan di atmosfer. Proses ini bermula ketika berkas sinar matahari yang tampak putih menembus butiran air hujan yang melayang di udara. Karena butiran air memiliki kerapatan optik yang lebih tinggi daripada udara, cahaya matahari dibelokkan atau mengalami pembiasan saat memasuki tetesan air tersebut. Pembelokan ini menyebabkan spektrum cahaya putih terurai menjadi berbagai panjang gelombang warna yang berbeda, mulai dari merah hingga ungu. Setelah mengenai dinding belakang butir air, sebagian berkas cahaya dipantulkan kembali menuju mata pengamat dengan sudut deviasi tertentu. Akibatnya, mata manusia menangkap lengkungan warna-warni yang indah di langit yang posisinya selalu membelakangi arah datangnya sinar matahari.`;

const L5_BODY = `Pak Rahmat dikenal sebagai sosok yang berhati emas oleh seluruh warga desa karena ketulusannya mengajar anak-anak kurang mampu tanpa memungut bayaran sepeser pun. Setiap fajar menyingsing, ia sudah memeras keringat mencangkul di sawah garapannya demi menghidupi keluarganya. Meski hidupnya berada di bawah garis kemiskinan, Pak Rahmat pantang berpangku tangan dan tidak pernah mengeluhkan nasibnya yang berat. Ketika balai desa dilanda badai perpecahan pendapat antarwarga, Pak Rahmat selalu tampil dengan kepala dingin untuk meredakan pertikaian dan mencari jalan tengah yang damai. Ketulusan hatinya yang tulus bagai mutiara terpendam menjadikannya panutan sejati bagi generasi muda. Berkat keteguhan prinsipnya, anak-anak didiknya kini banyak yang berhasil menjadi bunga bangsa yang membanggakan nama tanah air di kancah nasional.`;

const L6_BODY = `Di era keterbukaan informasi digital, banjir berita hoaks atau kabar bohong menjadi tantangan besar bagi literasi generasi muda Indonesia. Banyak pembaca mudah terperangkap oleh judul berita yang sensasional atau provokatif tanpa membaca keseluruhan isi artikel secara cermat. Kunci utama untuk membentengi diri dari hoaks adalah dengan menerapkan teknik membaca kritis serta selalu memverifikasi sumber berita kepada lembaga yang kredibel. Kita juga perlu memeriksa apakah foto atau video yang disertakan merupakan peristiwa asli atau sekadar hasil suntingan manipulatif. Membagikan informasi yang belum terbukti kebenarannya tidak hanya menyesatkan orang lain, tetapi juga dapat menimbulkan kegaduhan sosial yang merugikan banyak pihak. Oleh sebab itu, saring sebelum berbagi harus menjadi pedoman wajib bagi setiap warganet yang bertanggung jawab demi mewujudkan ruang digital yang sehat dan mendidik.`;

const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson-bahasa-1',
    title: 'Gagasan Pokok: Menjaga Kelestarian Ekosistem Sungai',
    subject: 'Bahasa Indonesia',
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    body: L1_BODY,
    questions: [
      {
        id: 'q1-1',
        position: 1,
        prompt: 'Apa gagasan utama dari pengelolaan sungai yang berkelanjutan?',
        answer_spans: [{ start: 178, end: 259 }]
      },
      {
        id: 'q1-2',
        position: 2,
        prompt: 'Apa dampak buruk pembuangan sampah plastik sembarangan terhadap aliran sungai?',
        answer_spans: [{ start: 315, end: 405 }]
      },
      {
        id: 'q1-3',
        position: 3,
        prompt: 'Mengapa air sungai yang tercemar bahan kimia berbahaya sangat merugikan lingkungan?',
        answer_spans: [{ start: 480, end: 533 }]
      },
      {
        id: 'q1-4',
        position: 4,
        prompt: 'Tindakan nyata apa yang sangat efektif dilakukan masyarakat untuk menjaga bantaran sungai?',
        answer_spans: [{ start: 551, end: 620 }]
      },
      {
        id: 'q1-5',
        position: 5,
        prompt: 'Apa kunci utama terciptanya lingkungan hidup yang lestari bagi generasi mendatang?',
        answer_spans: [{ start: 664, end: 717 }]
      }
    ]
  },
  {
    id: 'lesson-bahasa-2',
    title: 'Fakta dan Opini: Pelestarian Hutan Mangrove Pesisir',
    subject: 'Bahasa Indonesia',
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    body: L2_BODY,
    questions: [
      {
        id: 'q2-1',
        position: 1,
        prompt: 'Berapa luas kawasan mangrove yang telah berhasil direhabilitasi sepanjang tahun lalu?',
        answer_spans: [{ start: 171, end: 274 }]
      },
      {
        id: 'q2-2',
        position: 2,
        prompt: 'Apa pandangan subjektif aktivis lingkungan terhadap kegiatan penanaman kembali bibit bakau?',
        answer_spans: [{ start: 352, end: 454 }]
      },
      {
        id: 'q2-3',
        position: 3,
        prompt: 'Apa fungsi ilmiah dari akar tunjang pohon bakau yang rapat di muara sungai?',
        answer_spans: [{ start: 515, end: 598 }]
      },
      {
        id: 'q2-4',
        position: 4,
        prompt: 'Bagaimana pendapat sebagian wisatawan tentang hutan mangrove dibanding tempat lain?',
        answer_spans: [{ start: 651, end: 744 }]
      },
      {
        id: 'q2-5',
        position: 5,
        prompt: 'Masalah apa di lapangan yang terbukti menjadi ancaman serius bagi ekosistem pesisir?',
        answer_spans: [{ start: 788, end: 875 }]
      }
    ]
  },
  {
    id: 'lesson-bahasa-3',
    title: 'Pesan Moral: Kisah Semut Merah dan Burung Pipit',
    subject: 'Bahasa Indonesia',
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    body: L3_BODY,
    questions: [
      {
        id: 'q3-1',
        position: 1,
        prompt: 'Bagaimana burung pipit menolong semut merah yang hanyut di aliran sungai?',
        answer_spans: [{ start: 224, end: 294 }]
      },
      {
        id: 'q3-2',
        position: 2,
        prompt: 'Apa sifat atau watak utama yang ditunjukkan oleh burung pipit saat melihat semut kepayahan?',
        answer_spans: [{ start: 207, end: 223 }]
      },
      {
        id: 'q3-3',
        position: 3,
        prompt: 'Bahaya apa yang mengancam keselamatan burung pipit beberapa hari kemudian?',
        answer_spans: [{ start: 425, end: 560 }]
      },
      {
        id: 'q3-4',
        position: 4,
        prompt: 'Tindakan berani apa yang dilakukan semut merah untuk menyelamatkan sahabatnya?',
        answer_spans: [{ start: 628, end: 745 }]
      },
      {
        id: 'q3-5',
        position: 5,
        prompt: 'Apa pesan moral atau amanat utama dari kisah persahabatan tersebut?',
        answer_spans: [{ start: 814, end: 894 }]
      }
    ]
  },
  {
    id: 'lesson-bahasa-4',
    title: 'Sebab-Akibat: Memahami Fenomena Terjadinya Pelangi',
    subject: 'Bahasa Indonesia',
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    body: L4_BODY,
    questions: [
      {
        id: 'q4-1',
        position: 1,
        prompt: 'Apa penyebab utama munculnya fenomena optik pelangi di atmosfer?',
        answer_spans: [{ start: 55, end: 151 }]
      },
      {
        id: 'q4-2',
        position: 2,
        prompt: 'Mengapa sinar matahari mengalami pembelokan atau pembiasan saat menembus butiran hujan?',
        answer_spans: [{ start: 269, end: 345 }]
      },
      {
        id: 'q4-3',
        position: 3,
        prompt: 'Apa akibat dari pembelokan berkas cahaya putih di dalam tetesan air?',
        answer_spans: [{ start: 450, end: 576 }]
      },
      {
        id: 'q4-4',
        position: 4,
        prompt: 'Peristiwa apa yang terjadi pada berkas cahaya setelah mengenai dinding belakang butir air?',
        answer_spans: [{ start: 622, end: 716 }]
      },
      {
        id: 'q4-5',
        position: 5,
        prompt: 'Di mana letak posisi lengkungan pelangi jika dilihat oleh mata pengamat?',
        answer_spans: [{ start: 800, end: 860 }]
      }
    ]
  },
  {
    id: 'lesson-bahasa-5',
    title: 'Makna Kiasan: Cerita Keteladanan dan Perjuangan Hidup',
    subject: 'Bahasa Indonesia',
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    body: L5_BODY,
    questions: [
      {
        id: 'q5-1',
        position: 1,
        prompt: 'Apa bukti kalimat yang menunjukkan watak Pak Rahmat yang berhati emas?',
        answer_spans: [{ start: 82, end: 162 }]
      },
      {
        id: 'q5-2',
        position: 2,
        prompt: 'Ungkapan memeras keringat dalam cerita menggambarkan aktivitas apa yang dilakukan Pak Rahmat?',
        answer_spans: [{ start: 215, end: 274 }]
      },
      {
        id: 'q5-3',
        position: 3,
        prompt: 'Apa maksud kiasan bahwa Pak Rahmat pantang berpangku tangan menghadapi kesulitan hidup?',
        answer_spans: [{ start: 364, end: 409 }]
      },
      {
        id: 'q5-4',
        position: 4,
        prompt: 'Sikap apa yang ditunjukkan Pak Rahmat dengan ungkapan kepala dingin saat terjadi perpecahan di desa?',
        answer_spans: [{ start: 520, end: 583 }]
      },
      {
        id: 'q5-5',
        position: 5,
        prompt: 'Siapakah yang dimaksud dengan sebutan bunga bangsa dalam paragraf penutup cerita?',
        answer_spans: [{ start: 715, end: 833 }]
      }
    ]
  },
  {
    id: 'lesson-bahasa-6',
    title: 'Membaca Kritis: Memilah Fakta dan Menangkal Hoaks Digital',
    subject: 'Bahasa Indonesia',
    published: true,
    created_at: new Date().toISOString(),
    body: L6_BODY,
    questions: [
      {
        id: 'q6-1',
        position: 1,
        prompt: 'Apa yang sering membuat pembaca mudah terperangkap kabar bohong di media digital?',
        answer_spans: [{ start: 178, end: 276 }]
      },
      {
        id: 'q6-2',
        position: 2,
        prompt: 'Langkah apa yang menjadi kunci utama membentengi diri dari serbuan berita hoaks?',
        answer_spans: [{ start: 337, end: 440 }]
      },
      {
        id: 'q6-3',
        position: 3,
        prompt: 'Pemeriksaan apa yang wajib dilakukan pembaca terhadap foto atau video pendukung berita?',
        answer_spans: [{ start: 457, end: 572 }]
      },
      {
        id: 'q6-4',
        position: 4,
        prompt: 'Apa bahaya yang ditimbulkan jika seseorang membagikan informasi yang belum terbukti kebenarannya?',
        answer_spans: [{ start: 639, end: 738 }]
      },
      {
        id: 'q6-5',
        position: 5,
        prompt: 'Semboyan atau pedoman apa yang harus dipegang teguh oleh setiap warganet yang bertanggung jawab?',
        answer_spans: [{ start: 755, end: 849 }]
      }
    ]
  }
];

const INITIAL_ATTEMPTS: StudentAttempt[] = [
  {
    id: 'attempt-demo-1',
    student_id: 'student-budi',
    lesson_id: 'lesson-bahasa-1',
    score: 5,
    total: 5,
    submitted_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    profiles: { display_name: 'Budi Santoso' },
    lessons: { title: 'Gagasan Pokok: Menjaga Kelestarian Ekosistem Sungai', created_by: 'demo-user-ayambetutu' },
    answers: [
      { questionId: 'q1-1', start: 178, end: 259, correct: true },
      { questionId: 'q1-2', start: 315, end: 405, correct: true },
      { questionId: 'q1-3', start: 480, end: 533, correct: true },
      { questionId: 'q1-4', start: 551, end: 620, correct: true },
      { questionId: 'q1-5', start: 664, end: 717, correct: true }
    ]
  }
];

function getStoredLessons(): Lesson[] {
  try {
    const raw = localStorage.getItem('temukata_lessons_v3');
    if (raw) {
      return JSON.parse(raw) as Lesson[];
    }
  } catch {}
  localStorage.setItem('temukata_lessons_v3', JSON.stringify(INITIAL_LESSONS));
  return INITIAL_LESSONS;
}

function setStoredLessons(lessons: Lesson[]) {
  localStorage.setItem('temukata_lessons_v3', JSON.stringify(lessons));
}

function getStoredAttempts(): StudentAttempt[] {
  try {
    const raw = localStorage.getItem('temukata_attempts_v3');
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem('temukata_attempts_v3', JSON.stringify(INITIAL_ATTEMPTS));
  return INITIAL_ATTEMPTS;
}

function setStoredAttempts(attempts: StudentAttempt[]) {
  localStorage.setItem('temukata_attempts_v3', JSON.stringify(attempts));
}

// Fallback Mock API Client (Local-First Offline Demo Mode)
async function mockApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? 'GET';

  // 1. GET /lessons
  if (path === '/lessons' && method === 'GET') {
    return getStoredLessons() as T;
  }

  // 2. POST /lessons (Create Lesson)
  if (path === '/lessons' && method === 'POST') {
    const body = JSON.parse(init.body as string);
    const existing = getStoredLessons();
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: body.title,
      subject: body.subject,
      body: body.body,
      published: body.published,
      created_at: new Date().toISOString(),
      questions: body.questions.map((q: any, i: number) => {
        const start = body.body.indexOf(q.answerText);
        return {
          id: `q-${Date.now()}-${i}`,
          position: i + 1,
          prompt: q.prompt,
          answer_spans: start >= 0 ? [{ start, end: start + q.answerText.length }] : []
        };
      })
    };
    const updated = [newLesson, ...existing];
    setStoredLessons(updated);
    return newLesson as T;
  }

  // 3. POST /attempts/check (Instant Inline Validation)
  if (path === '/attempts/check' && method === 'POST') {
    const body = JSON.parse(init.body as string) as { lessonId: string; questionId: string; start: number; end: number };
    const lessons = getStoredLessons();
    const lesson = lessons.find(l => l.id === body.lessonId);
    if (!lesson) throw new Error('Lesson not found');
    const question = lesson.questions.find(q => q.id === body.questionId);
    if (!question || !question.answer_spans) throw new Error('Question not found');

    const selectedText = lesson.body.slice(body.start, body.end).trim();
    const isCorrect = question.answer_spans.some(span => {
      const indexMatch = Math.abs(span.start - body.start) <= 2 && Math.abs(span.end - body.end) <= 2;
      const expectedText = lesson.body.slice(span.start, span.end).trim();
      const textMatch = selectedText.length > 0 && selectedText.toLowerCase() === expectedText.toLowerCase();
      return indexMatch || textMatch;
    });

    return { correct: isCorrect } as T;
  }

  // 4. POST /attempts (Submit Attempt)
  if (path === '/attempts' && method === 'POST') {
    const body = JSON.parse(init.body as string) as {
      lessonId: string;
      answers: Array<{ questionId: string; start: number; end: number }>;
    };
    const lessons = getStoredLessons();
    const lesson = lessons.find(l => l.id === body.lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const results = body.answers.map(ans => {
      const q = lesson.questions.find(item => item.id === ans.questionId);
      const selectedText = lesson.body.slice(ans.start, ans.end).trim();
      const correct = Boolean(q?.answer_spans?.some(span => {
        const indexMatch = Math.abs(span.start - ans.start) <= 2 && Math.abs(span.end - ans.end) <= 2;
        const expectedText = lesson.body.slice(span.start, span.end).trim();
        return indexMatch || (selectedText.length > 0 && selectedText.toLowerCase() === expectedText.toLowerCase());
      }));
      return { questionId: ans.questionId, start: ans.start, end: ans.end, correct };
    });

    const score = results.filter(r => r.correct).length;
    const newAttempt: StudentAttempt = {
      id: `attempt-${Date.now()}`,
      student_id: 'demo-user-ayambetutu',
      lesson_id: body.lessonId,
      score,
      total: lesson.questions.length,
      submitted_at: new Date().toISOString(),
      profiles: { display_name: 'Siswa TemuKata' },
      lessons: { title: lesson.title, created_by: 'demo-user-ayambetutu' },
      answers: results
    };

    const existingAttempts = getStoredAttempts();
    setStoredAttempts([newAttempt, ...existingAttempts]);
    return newAttempt as T;
  }

  // 5. GET /leaderboard
  if (path.startsWith('/leaderboard') && method === 'GET') {
    const period = path.includes('period=monthly') ? 'monthly' : 'weekly';
    return buildLocalLeaderboard(null, period) as T;
  }

  // 6. GET /teacher/overview
  if (path === '/teacher/overview' && method === 'GET') {
    const lessons = getStoredLessons();
    const attempts = getStoredAttempts();
    return {
      totalLessons: lessons.length,
      totalAttempts: attempts.length,
      recentAttempts: attempts.slice(0, 10)
    } as T;
  }

  throw new Error(`Endpoint mock '${path}' [${method}] tidak ditemukan`);
}

export async function api<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch {
    return mockApi<T>(path, init);
  }
}
