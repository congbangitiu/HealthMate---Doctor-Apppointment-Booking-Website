import OutPatientDepartment from '../../images/speciaties/OutPatient.jpg';
import ParaclinicalDepartment from '../../images/speciaties/Paraclinical.jpg';
import InternalMedicineDepartment from '../../images/speciaties/InternalMedicine.jpg';
import SurgeryDepartment from '../../images/speciaties/Surgery.jpg';
import PediatricsDepartment from '../../images/speciaties/Pediatrics.jpg';
import EmergencyDepartment from '../../images/speciaties/Emergency.jpg';
import OrthopedicsDepartment from '../../images/speciaties/Orthopedics.jpg';
import DermatologyDepartment from '../../images/speciaties/Dermatology.jpg';
import RespiratoryDepartment from '../../images/speciaties/Respiratory.jpg';
import RehabilitationDepartment from '../../images/speciaties/Rehabilitation.jpg';
import OphthalmologyDepartment from '../../images/speciaties/Ophthalmology.jpg';
import DentomaxillofacialDepartment from '../../images/speciaties/Dentomaxillofacial.jpg';

const specialties = [
    {
        id: 'outpatient',
        name: 'Outpatient Department',
        abbreviation: 'OPD',
        image: OutPatientDepartment,
        description:
            'The Outpatient Department (OPD) is the first point of contact between patients and the hospital’s healthcare system. It provides comprehensive diagnostic, treatment, and health management services for individuals with non-emergency and non-hospitalized medical conditions. The department is designed to facilitate streamlined patient care, timely follow-ups, and preventive health interventions in a patient-centered environment. Staffed by multidisciplinary professionals, the OPD enables coordinated care across specialties with access to diagnostic support and referral pathways when needed.',

        keyFunctions: [
            {
                title: 'Clinical Consultation and Diagnosis',
                details: [
                    'Conduct physical examinations and symptom assessment',
                    'Take comprehensive patient medical history',
                    'Order and interpret necessary laboratory and imaging tests',
                ],
            },
            {
                title: 'Outpatient Treatment and Management',
                details: [
                    'Prescribe medication and non-invasive treatments',
                    'Develop and update treatment plans for chronic conditions',
                    'Provide lifestyle and dietary counseling',
                ],
            },
            {
                title: 'Follow-up and Health Monitoring',
                details: [
                    'Schedule and manage re-examinations for ongoing care',
                    'Monitor patient response to treatment',
                    'Adjust therapeutic interventions based on progress',
                ],
            },
            {
                title: 'Patient Education and Support',
                details: [
                    'Educate patients on disease prevention and self-care',
                    'Guide on medication adherence and home monitoring',
                    'Provide psychological support and wellness advice',
                ],
            },
            {
                title: 'Basic Diagnostic and Support Services',
                details: [
                    'Blood tests and urine analysis',
                    'Basic imaging: X-ray and ultrasound',
                    'Pre-operative assessments and referrals if needed',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Initial Assessment',
                    steps: [
                        'Patient registration and vital signs measurement',
                        'Triage based on presenting symptoms',
                        'Assignment to the appropriate specialty clinic',
                    ],
                    qualityControl: ['Ensure accurate patient identification', 'Timely triage protocols'],
                },
                {
                    stage: 'Consultation and Diagnostics',
                    steps: [
                        'Face-to-face consultation with physician',
                        'Ordering of tests (lab, imaging)',
                        'On-site collection of samples or imaging procedures',
                    ],
                    qualityControl: ['Standardized consultation checklists', 'Proper documentation in EMR'],
                },
                {
                    stage: 'Treatment and Follow-up Planning',
                    steps: [
                        'Provide diagnosis and treatment recommendations',
                        'Issue prescriptions and lifestyle advice',
                        'Schedule follow-up appointments if needed',
                    ],
                    qualityControl: [
                        'Treatment review by senior physician (if needed)',
                        'Follow-up compliance tracking',
                    ],
                },
            ],
        },
    },
    {
        id: 'paraclinical',
        name: 'Paraclinical Department',
        abbreviation: 'PCL',
        image: ParaclinicalDepartment,
        description:
            'The Paraclinical Department serves as the diagnostic backbone of our healthcare institution, integrating cutting-edge technology with expert analysis to deliver precise diagnostic insights. Our department operates 24/7 to provide comprehensive laboratory services including hematology, clinical chemistry, microbiology, and advanced histopathology, alongside state-of-the-art medical imaging modalities such as high-resolution CT, 3T MRI, and interventional radiology procedures. We maintain ISO 15189 accreditation and CAP certification, ensuring international standards of quality and reliability for all diagnostic outputs that form the foundation of patient care decisions across all clinical specialties.',

        keyFunctions: [
            {
                title: 'Diagnostic Testing Services',
                details: [
                    'Comprehensive laboratory testing (hematology, chemistry, immunology)',
                    'Microbiological cultures and molecular diagnostics',
                    'Histopathology and cytology examinations',
                ],
            },
            {
                title: 'Medical Imaging Division',
                details: [
                    'Digital radiography (X-ray/CT/MRI)',
                    'Ultrasonography with Doppler imaging',
                    'Interventional radiology procedures',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Pre-Analytical',
                    steps: [
                        'Electronic order entry with clinical decision support',
                        'Barcode specimen labeling system',
                        'Automated transport to core lab',
                    ],
                    qualityControl: ['Dual patient identification verification', 'Specimen acceptability checks'],
                },
                {
                    stage: 'Analytical',
                    steps: [
                        'Automated testing on Roche Cobas 8000 platform',
                        'Manual testing for specialized assays',
                        'Radiologist interpretation of imaging studies',
                    ],
                    qualityControl: ['Daily calibration of instruments', 'Internal quality control samples'],
                },
                {
                    stage: 'Post-Analytical',
                    steps: [
                        'Pathologist/Radiologist validation',
                        'Critical result notification protocol',
                        'EMR integration with physician alerts',
                    ],
                    qualityControl: ['Turnaround time monitoring', 'Clinician feedback system'],
                },
            ],
        },
    },
    {
        id: 'internal-medicine',
        name: 'Internal Medicine Department',
        abbreviation: 'IM',
        image: InternalMedicineDepartment,
        description:
            'The Internal Medicine Department serves as the cornerstone of adult medical care, providing comprehensive, evidence-based management of complex multi-system diseases. Our department brings together world-class internists and subspecialists to deliver personalized care for conditions ranging from acute illnesses to chronic disorders. With a patient-centered approach, we integrate advanced diagnostic technologies, cutting-edge treatment protocols, and preventive health strategies to optimize outcomes.',
        subspecialties: [
            {
                name: 'Pulmonology',
                description:
                    'Diagnosis and treatment of respiratory diseases including asthma, pneumonia, bronchitis, and chronic obstructive pulmonary disease (COPD).',
            },
            {
                name: 'Cardiology',
                description:
                    'Management of cardiovascular conditions such as hypertension, myocardial infarction, heart failure, and coronary artery disease.',
            },
            {
                name: 'Gastroenterology',
                description:
                    'Care for digestive system disorders including gastric ulcers, hepatitis, and inflammatory bowel disease.',
            },
            {
                name: 'Endocrinology',
                description:
                    'Treatment of endocrine disorders like diabetes mellitus, thyroid diseases, and metabolic syndrome.',
            },
            {
                name: 'Nephrology',
                description:
                    'Management of kidney and urinary tract conditions including renal failure, cystitis, and kidney stones.',
            },
            {
                name: 'Neurology',
                description:
                    "Care for neurological disorders such as chronic headaches, insomnia, stroke, and Parkinson's disease.",
            },
            {
                name: 'Rheumatology',
                description:
                    'Treatment of musculoskeletal disorders including rheumatoid arthritis, osteoarthritis, and osteoporosis.',
            },
        ],
        keyFunctions: [
            {
                title: 'Comprehensive Disease Management',
                details: [
                    'Diagnosis and treatment of acute and chronic conditions',
                    'Coordination with surgical specialties when intervention is required',
                    'Long-term management of chronic diseases',
                ],
            },
            {
                title: 'Preventive Healthcare',
                details: [
                    'Health risk assessments',
                    'Chronic disease screening programs',
                    'Vaccination for adult patients',
                ],
            },
        ],
        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Clinical Assessment',
                    steps: [
                        'Electronic patient history capture with AI-assisted symptom analysis',
                        'Comprehensive physical examination using digital documentation tools',
                        'Automated vital sign integration with EMR',
                    ],
                    qualityControl: ['Dual verification of patient history', 'Standardized examination protocols'],
                },
                {
                    stage: 'Diagnostic Evaluation',
                    steps: [
                        'Evidence-based test ordering with clinical decision support',
                        'Point-of-care testing (POCT) for rapid results',
                        'Specialist consultation triage system',
                    ],
                    qualityControl: ['Test appropriateness algorithms', 'Real-time insurance authorization checks'],
                },
                {
                    stage: 'Therapeutic Intervention',
                    steps: [
                        'Personalized treatment plans with pharmacogenomic considerations',
                        'Automated medication reconciliation',
                        'Multidisciplinary case conferences for complex patients',
                    ],
                    qualityControl: ['Drug interaction screening', 'Treatment protocol adherence monitoring'],
                },
                {
                    stage: 'Follow-up Management',
                    steps: [
                        'Automated discharge summary generation',
                        'Structured telehealth follow-up scheduling',
                        'Chronic disease management program enrollment',
                    ],
                    qualityControl: ['30-day readmission risk assessment', 'Patient satisfaction surveys'],
                },
            ],
        },
    },
    {
        id: 'surgery',
        name: 'Surgery Department',
        abbreviation: 'SURG',
        image: SurgeryDepartment,
        description: `The Surgery Department serves as the cornerstone of our hospital's interventional care, delivering comprehensive surgical solutions ranging from minimally invasive procedures to complex operations. Our department combines advanced robotic systems (including da Vinci Xi platforms), cutting-edge imaging guidance, and a multidisciplinary team approach to ensure optimal patient outcomes.`,

        keyFunctions: [
            {
                title: 'Surgical Intervention Services',
                details: [
                    'Open, laparoscopic, and robotic-assisted procedures',
                    'Trauma and emergency surgical care',
                    'Surgical oncology and reconstruction',
                ],
            },
            {
                title: 'Perioperative Care Division',
                details: [
                    'Pre-anesthesia evaluation and optimization',
                    'Intraoperative neuromonitoring',
                    'Enhanced recovery after surgery (ERAS) protocols',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Pre-Operative',
                    steps: [
                        'Multidisciplinary surgical consultation',
                        'Pre-anesthesia evaluation and risk stratification',
                        'Patient optimization using ERAS protocols',
                    ],
                    qualityControl: ['Surgical checklist verification', 'Antibiotic prophylaxis timing monitoring'],
                },
                {
                    stage: 'Intra-Operative',
                    steps: [
                        'Standardized surgical timeout procedure',
                        'Real-time imaging guidance (fluoroscopy/ultrasound)',
                        'Intraoperative pathology consultation when needed',
                    ],
                    qualityControl: ['Surgical sponge/instrument counts', 'Continuous vital sign monitoring'],
                },
                {
                    stage: 'Post-Operative',
                    steps: [
                        'PACU recovery with multimodal pain management',
                        'Early ambulation and physical therapy initiation',
                        'Surgical wound care and complication surveillance',
                    ],
                    qualityControl: ['24-hour postoperative follow-up', 'VTE prophylaxis compliance tracking'],
                },
            ],
        },
    },
    {
        id: 'pediatrics',
        name: 'Pediatrics Department',
        abbreviation: 'PED',
        image: PediatricsDepartment,
        description:
            'The Pediatrics Department is a vital specialty dedicated to the health and well-being of infants, children, and adolescents. Our department provides comprehensive outpatient and inpatient care for a wide range of pediatric illnesses, from common infections to complex chronic conditions. Our pediatricians are trained to diagnose, treat, and prevent diseases while closely monitoring the physical, emotional, and developmental growth of young patients. In addition to treating acute and chronic conditions, we actively engage in preventive care, routine vaccinations, developmental screenings, and nutrition counseling to ensure children receive holistic and age-appropriate healthcare. Our child-friendly environment is designed to ease anxiety and promote comfort during visits, fostering a positive medical experience for both children and their families.',

        keyFunctions: [
            {
                title: 'Pediatric Medical Services',
                details: [
                    'Examination and diagnosis of common childhood illnesses (fever, cough, cold, diarrhea)',
                    'Treatment of acute and chronic pediatric conditions including asthma, meningitis, and congenital heart disease',
                    'Management of pediatric emergencies and inpatient monitoring when necessary',
                ],
            },
            {
                title: 'Preventive Care and Developmental Monitoring',
                details: [
                    'Comprehensive immunization programs for children (measles, hepatitis B, whooping cough, etc.)',
                    'Growth tracking including height, weight, and developmental milestones',
                    'Parental counseling on nutrition, hygiene, and child development',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Patient Intake',
                    steps: [
                        'Collect patient history including symptoms, immunization records, and growth milestones',
                        'Record vital signs (temperature, respiratory rate, pulse, etc.)',
                    ],
                    qualityControl: ['Verification of vaccination schedule', 'Parent/guardian identification checks'],
                },
                {
                    stage: 'Clinical Evaluation',
                    steps: [
                        'General physical examination by pediatrician',
                        'Assessment of presenting symptoms and clinical indicators',
                        'Request diagnostic tests if necessary (e.g., blood test, imaging)',
                    ],
                    qualityControl: ['Pediatric triage protocols', 'Use of age-specific reference values'],
                },
                {
                    stage: 'Treatment and Parental Guidance',
                    steps: [
                        'Diagnosis and prescription of appropriate treatment',
                        'Discharge instructions or hospital admission if required',
                        'Educate parents on medication usage, home care, and warning signs',
                    ],
                    qualityControl: ['Double-check medication dosages by weight', 'Follow-up scheduling protocol'],
                },
            ],
        },
    },

    {
        id: 'dermatology',
        name: 'Dermatology Department',
        abbreviation: 'DERM',
        image: DermatologyDepartment,
        description:
            'The Dermatology Department specializes in diagnosing and treating a wide range of skin, hair, and nail disorders. Our team of experienced dermatologists uses both medical and cosmetic dermatological approaches to provide holistic care tailored to each patient’s needs. From managing chronic conditions like eczema, acne, and psoriasis to detecting and treating skin cancers, we focus on early diagnosis and minimally invasive treatment options. The department also offers advanced cosmetic procedures such as laser therapy, chemical peels, and skin rejuvenation treatments, ensuring patients not only feel better but also look their best.',

        keyFunctions: [
            {
                title: 'Medical Dermatology',
                details: [
                    'Diagnosis and treatment of eczema, acne, psoriasis, rosacea, fungal infections',
                    'Skin allergy testing and management of contact dermatitis',
                    'Autoimmune skin disorders (e.g., vitiligo, lupus-related rashes)',
                ],
            },
            {
                title: 'Dermato-oncology',
                details: [
                    'Skin cancer screening and biopsy (e.g., melanoma, basal cell carcinoma)',
                    'Surgical excision and cryotherapy for benign and malignant lesions',
                    'Follow-up and mole mapping for high-risk patients',
                ],
            },
            {
                title: 'Aesthetic Dermatology',
                details: [
                    'Laser treatments for pigmentation, vascular lesions, and hair removal',
                    'Chemical peels, microneedling, and acne scar treatments',
                    'Anti-aging therapies: Botox, dermal fillers, skin tightening procedures',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Initial Consultation',
                    steps: [
                        'Assessment of skin condition and medical history',
                        'Dermatoscopic examination or Wood’s lamp use for diagnosis',
                        'Photography and documentation for baseline',
                    ],
                    qualityControl: ['Standardized skin assessment forms', 'Infection control for instruments'],
                },
                {
                    stage: 'Diagnostic Testing',
                    steps: [
                        'Skin biopsy or lesion scraping',
                        'Patch testing for allergies',
                        'Histopathological analysis in lab',
                    ],
                    qualityControl: ['Biopsy labeling protocol', 'Patient consent for invasive procedures'],
                },
                {
                    stage: 'Treatment and Follow-Up',
                    steps: [
                        'Topical/systemic therapy prescription',
                        'Procedural treatment (e.g., laser, cryo, minor surgery)',
                        'Follow-up appointments for monitoring or cosmetic results',
                    ],
                    qualityControl: ['Treatment response documentation', 'Adverse reaction logging'],
                },
            ],
        },
    },
    {
        id: 'respiratory',
        name: 'Respiratory Department',
        abbreviation: 'RESP',
        image: RespiratoryDepartment,
        description:
            'The Respiratory Department provides comprehensive care for patients with acute and chronic respiratory diseases. With a multidisciplinary team of pulmonologists, respiratory therapists, and critical care specialists, we focus on early diagnosis, effective treatment, and long-term management of respiratory conditions. The department is equipped with advanced diagnostics such as pulmonary function testing, bronchoscopy, and high-resolution CT scanning. From asthma and chronic obstructive pulmonary disease (COPD) to pneumonia and tuberculosis, we offer evidence-based care aimed at improving lung health and overall patient outcomes.',

        keyFunctions: [
            {
                title: 'Diagnosis and Management of Respiratory Disorders',
                details: [
                    'Treatment of asthma, COPD, bronchitis, pneumonia, and interstitial lung disease',
                    'Management of respiratory infections including tuberculosis',
                    'Care for sleep apnea and snoring through sleep studies and therapy',
                ],
            },
            {
                title: 'Respiratory Diagnostics',
                details: [
                    'Pulmonary function tests (PFTs) including spirometry, DLCO',
                    'Bronchoscopy for airway evaluation and biopsy',
                    'Arterial blood gas analysis and oxygen saturation monitoring',
                ],
            },
            {
                title: 'Respiratory Support and Rehabilitation',
                details: [
                    'Oxygen therapy and nebulization services',
                    'Non-invasive ventilation (BiPAP/CPAP)',
                    'Pulmonary rehabilitation programs for chronic lung disease patients',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Patient Evaluation',
                    steps: [
                        'Collection of history and symptom analysis (dyspnea, cough, wheezing)',
                        'Physical examination including chest auscultation',
                        'Request for imaging (X-ray/CT) and lab tests',
                    ],
                    qualityControl: ['Smoking history assessment', 'Symptom severity scoring (e.g., MRC scale)'],
                },
                {
                    stage: 'Testing and Diagnosis',
                    steps: [
                        'Pulmonary function testing (spirometry)',
                        'Bronchoscopy with lavage or biopsy if indicated',
                        'Microbiology tests for infectious agents (e.g., sputum culture, GeneXpert)',
                    ],
                    qualityControl: ['Proper test calibration', 'Specimen quality verification'],
                },
                {
                    stage: 'Treatment and Monitoring',
                    steps: [
                        'Medication prescription (bronchodilators, corticosteroids, antibiotics)',
                        'Ongoing monitoring of lung function and symptom improvement',
                        'Counseling on smoking cessation and environmental control',
                    ],
                    qualityControl: ['Follow-up scheduling', 'Medication adherence tracking'],
                },
            ],
        },
    },
    {
        id: 'rehabilitation',
        name: 'Rehabilitation Department',
        abbreviation: 'REHAB',
        image: RehabilitationDepartment,
        description:
            'The Rehabilitation Department is dedicated to helping patients regain functional independence after injury, surgery, or illness. Our multidisciplinary team includes physiotherapists, occupational therapists, speech therapists, and rehabilitation doctors. The department treats patients with neurological disorders, musculoskeletal conditions, post-stroke impairments, sports injuries, and post-operative recovery needs. We provide individualized care plans using evidence-based techniques such as therapeutic exercises, electrotherapy, hydrotherapy, and assistive device training.',

        keyFunctions: [
            {
                title: 'Physical Rehabilitation',
                details: [
                    'Post-stroke and spinal cord injury recovery',
                    'Post-operative joint and muscle rehabilitation',
                    'Sports injury management and therapy',
                ],
            },
            {
                title: 'Occupational & Speech Therapy',
                details: [
                    'Fine motor skill development and daily living training',
                    'Speech and language therapy for neurological conditions',
                    'Swallowing therapy and cognitive retraining',
                ],
            },
            {
                title: 'Assistive Technology & Support',
                details: [
                    'Custom orthotics and prosthetics training',
                    'Wheelchair and mobility device assessments',
                    'Home safety evaluations and patient education',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Initial Evaluation',
                    steps: [
                        'Medical history review and functional assessment',
                        'Goal setting with patient and family',
                        'Baseline physical and neurological tests',
                    ],
                    qualityControl: ['Standardized assessment tools', 'Patient goal alignment tracking'],
                },
                {
                    stage: 'Therapy Planning & Implementation',
                    steps: [
                        'Customized therapy sessions (physical/occupational/speech)',
                        'Application of supportive technologies and aids',
                        'Group therapy or individual sessions based on needs',
                    ],
                    qualityControl: ['Weekly progress review', 'Multidisciplinary case discussions'],
                },
                {
                    stage: 'Discharge & Follow-up',
                    steps: [
                        'Final outcome assessment and discharge plan',
                        'Home exercise program and education',
                        'Scheduled follow-up visits',
                    ],
                    qualityControl: ['Patient satisfaction surveys', 'Relapse prevention planning'],
                },
            ],
        },
    },
    {
        id: 'ophthalmology',
        name: 'Ophthalmology Department',
        abbreviation: 'OPH',
        image: OphthalmologyDepartment,
        description:
            'The Ophthalmology Department provides comprehensive eye care services for patients of all ages, from routine vision screening to advanced surgical procedures. Our team of ophthalmologists specializes in the diagnosis and treatment of eye diseases including cataracts, glaucoma, diabetic retinopathy, macular degeneration, and refractive errors. With access to modern equipment such as OCT, slit-lamp microscopy, and laser systems, we ensure precise diagnostics and high-quality interventions. Preventive screenings and pediatric eye care are also integral parts of our mission.',

        keyFunctions: [
            {
                title: 'Comprehensive Eye Examinations',
                details: [
                    'Vision testing and refraction (for glasses/contact lenses)',
                    'Screening for glaucoma, cataracts, and retinal diseases',
                    'Ocular pressure and slit-lamp examinations',
                ],
            },
            {
                title: 'Medical and Surgical Treatments',
                details: [
                    'Cataract surgery and lens implantation',
                    'Laser therapy for diabetic retinopathy and glaucoma',
                    'Surgical correction of eye misalignment (strabismus)',
                ],
            },
            {
                title: 'Pediatric and Preventive Eye Care',
                details: [
                    'Lazy eye (amblyopia) and strabismus management',
                    'Regular school screenings and eye health education',
                    'Preventive care for computer vision syndrome',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Initial Assessment',
                    steps: [
                        'Medical and visual history collection',
                        'Visual acuity and intraocular pressure test',
                        'Slit-lamp and fundus examination',
                    ],
                    qualityControl: ['Visual chart calibration', 'Sterile equipment use'],
                },
                {
                    stage: 'Diagnostic Imaging and Testing',
                    steps: [
                        'OCT scans, visual field tests',
                        'Ultrasound for opaque media evaluation',
                        'Fluorescein angiography if needed',
                    ],
                    qualityControl: ['Equipment maintenance logs', 'Test interpretation by certified specialists'],
                },
                {
                    stage: 'Treatment & Follow-up',
                    steps: [
                        'Prescription of corrective lenses or medications',
                        'Scheduling of laser or surgical procedures',
                        'Post-op care and visual rehabilitation',
                    ],
                    qualityControl: ['Surgical outcome tracking', 'Follow-up compliance monitoring'],
                },
            ],
        },
    },
    {
        id: 'dentomaxillofacial',
        name: 'Dentomaxillofacial Department',
        abbreviation: 'DMF',
        image: DentomaxillofacialDepartment,
        description:
            'The Dentomaxillofacial Department specializes in the prevention, diagnosis, and treatment of dental, oral, and facial conditions. Services range from general dentistry (cleanings, fillings, extractions) to advanced maxillofacial surgery for trauma, tumors, or congenital defects. The department also provides orthodontic treatments, cosmetic dentistry, and dental implantology. Our team of dentists, oral surgeons, and orthodontists work collaboratively using digital radiography, 3D imaging, and minimally invasive techniques to ensure optimal oral health and facial harmony.',

        keyFunctions: [
            {
                title: 'General and Preventive Dentistry',
                details: [
                    'Oral exams, scaling, and tooth fillings',
                    'Tooth extraction and fluoride treatments',
                    'Oral hygiene education and preventive care',
                ],
            },
            {
                title: 'Surgical and Reconstructive Care',
                details: [
                    'Wisdom tooth surgery and cyst removal',
                    'Management of maxillofacial trauma',
                    'Dental implant placement and bone grafting',
                ],
            },
            {
                title: 'Orthodontic and Cosmetic Services',
                details: [
                    'Braces, aligners, and jaw correction',
                    'Teeth whitening and aesthetic restorations',
                    'Smile design and veneer applications',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Examination and Diagnosis',
                    steps: [
                        'Oral cavity inspection and radiographs (X-rays, OPG)',
                        'Dental charting and bite analysis',
                        'Diagnosis of caries, infections, or malocclusion',
                    ],
                    qualityControl: ['Sterilization protocols', 'Diagnostic accuracy review'],
                },
                {
                    stage: 'Treatment Planning and Execution',
                    steps: [
                        'Creation of personalized treatment plan',
                        'Performance of procedures under local or general anesthesia',
                        'Use of CAD/CAM technology for precision dentistry',
                    ],
                    qualityControl: ['Surgical safety checklist', 'Procedure documentation'],
                },
                {
                    stage: 'Aftercare and Follow-up',
                    steps: [
                        'Post-op monitoring and pain management',
                        'Reinforcement of oral care instructions',
                        'Scheduled dental cleaning and re-evaluation',
                    ],
                    qualityControl: ['Healing progress notes', 'Patient satisfaction follow-up'],
                },
            ],
        },
    },
    {
        id: 'emergency',
        name: 'Emergency – Intensive Care – Toxicology Department',
        abbreviation: 'EIC',
        image: EmergencyDepartment,
        description:
            'The Emergency – Intensive Care – Toxicology Department is a multidisciplinary unit that plays a critical role in the hospital by providing immediate and specialized care for patients experiencing life-threatening medical conditions. This department combines emergency medicine, intensive care, and toxicology to manage a wide range of critical health issues such as trauma, acute organ failure, poisoning, and cardiopulmonary emergencies. The team of physicians, nurses, and specialists are available 24/7 to ensure rapid response, stabilization, and continuous monitoring using advanced equipment and life-saving interventions. Whether through mechanical ventilation, critical drug infusions, or detoxification protocols, the department ensures that every second counts in saving lives and guiding recovery.',

        keyFunctions: [
            {
                title: 'Emergency Response and Trauma Management',
                details: [
                    'Immediate triage and assessment of critical patients',
                    'Emergency treatment for trauma (e.g. road accidents, burns, falls)',
                    'Management of acute internal conditions like stroke, seizures, or chest pain',
                ],
            },
            {
                title: 'Intensive Care and Life Support',
                details: [
                    'Continuous monitoring and advanced life support for unstable patients',
                    'Mechanical ventilation, vasopressor therapy, and cardiac support',
                    'Critical care for respiratory failure and acute heart failure',
                ],
            },
            {
                title: 'Toxicology and Poison Control',
                details: [
                    'Management of drug overdoses and chemical poisoning',
                    'Decontamination and antidote administration protocols',
                    'Monitoring metabolic and organ responses to toxins',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Triage and Initial Evaluation',
                    steps: [
                        'Rapid triage by trained nurses to assess urgency',
                        'Vital signs monitoring and prioritization of care level',
                        'Assigning patients to appropriate emergency zones (e.g., red, yellow, green)',
                    ],
                    qualityControl: [
                        'Triage within 5 minutes of arrival',
                        'Use of standardized triage scales (e.g., ESI)',
                    ],
                },
                {
                    stage: 'Resuscitation and Diagnosis',
                    steps: [
                        'Emergency physician clinical examination',
                        'Point-of-care testing (blood tests, ECG, imaging)',
                        'Airway management, IV access, and medication administration',
                    ],
                    qualityControl: ['Time to intervention tracking', 'Checklist for major trauma and cardiac arrest'],
                },
                {
                    stage: 'Stabilization and Monitoring',
                    steps: [
                        'Transfer to ICU if necessary for advanced support',
                        '24/7 monitoring via telemetry and ventilators',
                        'Adjustment of treatment plans based on real-time data',
                    ],
                    qualityControl: ['Nurse-to-patient ratio adherence', 'Critical event documentation audit'],
                },
                {
                    stage: 'Disposition',
                    steps: [
                        'Transfer to specialty ward if stable',
                        'Discharge with home-care instructions and follow-up schedule',
                        'Referral to toxicology or chronic care services if needed',
                    ],
                    qualityControl: ['Discharge summary review', 'Follow-up compliance monitoring'],
                },
            ],
        },
    },
    {
        id: 'orthopedics',
        name: 'Orthopedics and Musculoskeletal Department',
        abbreviation: 'ORT',
        image: OrthopedicsDepartment,
        description:
            'The Orthopedics and Musculoskeletal Department at HealthMate is dedicated to the diagnosis, treatment, and rehabilitation of disorders related to the bones, joints, muscles, ligaments, and tendons. Our mission is to restore mobility and improve the quality of life for patients suffering from injuries, degenerative diseases, and musculoskeletal conditions. The department integrates advanced surgical techniques, modern imaging diagnostics, and multidisciplinary rehabilitation programs to provide comprehensive care. From treating fractures and sports injuries to managing chronic conditions like osteoarthritis and osteoporosis, our team delivers personalized treatment plans with a strong emphasis on early intervention and long-term recovery.',

        keyFunctions: [
            {
                title: 'Diagnosis and Non-Surgical Management',
                details: [
                    'Evaluation of joint pain, stiffness, swelling, and mobility limitations',
                    'Management of musculoskeletal disorders such as arthritis, tendonitis, bursitis, and back pain',
                    'Prescription of physiotherapy, pain management, and orthopedic devices (e.g., braces, orthotics)',
                ],
            },
            {
                title: 'Surgical Treatment and Intervention',
                details: [
                    'Open and minimally invasive surgery for fractures, ligament tears, and dislocations',
                    'Joint replacement surgeries (e.g., hip, knee, shoulder arthroplasty)',
                    'Arthroscopic procedures for cartilage repair and ligament reconstruction',
                ],
            },
            {
                title: 'Rehabilitation and Postoperative Care',
                details: [
                    'Customized rehabilitation programs for recovery after injury or surgery',
                    'Coordination with physiotherapists and pain specialists',
                    'Education on ergonomics, posture, and injury prevention strategies',
                ],
            },
        ],

        clinicalWorkflow: {
            phases: [
                {
                    stage: 'Initial Consultation and Assessment',
                    steps: [
                        'Comprehensive physical examination of affected joints or limbs',
                        'Collection of patient history and pain severity evaluation',
                        'Ordering of diagnostic tests such as X-ray, MRI, CT scan or ultrasound',
                    ],
                    qualityControl: [
                        'Pain scale documentation',
                        'Orthopedic functional scoring (e.g., Oxford Knee Score)',
                    ],
                },
                {
                    stage: 'Treatment Planning',
                    steps: [
                        'Multidisciplinary case review (orthopedic surgeon, radiologist, physio)',
                        'Selection of conservative vs. surgical approach based on diagnosis',
                        'Patient counseling on expected outcomes and risks',
                    ],
                    qualityControl: ['Shared decision-making protocol', 'Informed consent checklist'],
                },
                {
                    stage: 'Surgery and Intervention (if needed)',
                    steps: [
                        'Preoperative preparation and anesthesia evaluation',
                        'Surgical intervention using minimally invasive or open techniques',
                        'Post-op wound care and infection prevention',
                    ],
                    qualityControl: ['Sterility checklist', 'Surgical time-out protocol', 'VTE prophylaxis compliance'],
                },
                {
                    stage: 'Rehabilitation and Follow-Up',
                    steps: [
                        'Regular physiotherapy sessions and strength training',
                        'Mobility aids and home exercise instruction',
                        'Scheduled follow-up visits and imaging to monitor progress',
                    ],
                    qualityControl: ['Rehabilitation adherence tracking', 'Return-to-activity scoring'],
                },
            ],
        },
    },
];
export default specialties;
