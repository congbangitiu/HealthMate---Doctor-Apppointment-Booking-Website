import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './SpecialtyDetails.module.scss';
import specialties from '../../assets/data/mock-data/specialties';

const cx = classNames.bind(styles);

const SpecialtyDetails = () => {
    const { id } = useParams();
    const specialty = specialties.find((item) => item.id === id);
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, [id]);

    return (
        <div className={cx('container')}>
            <aside>
                {specialties.map((specialty) => (
                    <Link
                        key={specialty.id}
                        className={cx('tab', { active: id === specialty.id })}
                        to={`/specialties/${specialty.id}`}
                    >
                        {specialty.name}
                    </Link>
                ))}
            </aside>
            <main>
                {/* Header section */}
                <header>
                    <h1>
                        {specialty.name} ({specialty.abbreviation})
                    </h1>
                    <img src={specialty.image} alt={specialty.name} />
                </header>

                {/* Description */}
                <div className={cx('overview')}>
                    <h2>Overview</h2>
                    <p>{specialty.description}</p>
                </div>

                {/* Subspecialties - if any */}
                <div className={cx('subspecialties')}>
                    <h2>Subspecialties</h2>
                    <div className={cx('subspecialties-grid')}>
                        {specialty.subspecialties.map((sub, index) => (
                            <div key={index} className={cx('subspecialty-card')}>
                                <h3>{sub.name}</h3>
                                <p>{sub.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Functions */}
                <div className={cx('key-functions')}>
                    <h2>Key Functions</h2>
                    <div className={cx('functions-grid')}>
                        {specialty.keyFunctions.map((func, index) => (
                            <div key={index} className={cx('function-card')}>
                                <h3>{func.title}</h3>
                                <ul>
                                    {func.details.map((detail, i) => (
                                        <li key={i}>{detail}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clinical Workflow */}
                <div className={cx('clinical-workflow')}>
                    <h2>Clinical Workflow</h2>
                    <div className={cx('workflow')}>
                        {specialty.clinicalWorkflow.phases.map((phase, index) => (
                            <div key={index} className={cx('phase')}>
                                <h3 data-phase={index + 1}>{phase.stage}</h3>
                                <div className={cx('phase-content')}>
                                    <div className={cx('steps')}>
                                        <h4>Procedure Steps</h4>
                                        <ol>
                                            {phase.steps.map((step, i) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div className={cx('quality-control')}>
                                        <h4>Quality Assurance</h4>
                                        <ul>
                                            {phase.qualityControl.map((qc, i) => (
                                                <li key={i}>{qc}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SpecialtyDetails;
