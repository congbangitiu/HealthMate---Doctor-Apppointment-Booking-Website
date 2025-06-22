import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './SpecialtyDetails.module.scss';
import specialties from '../../assets/data/mock-data/specialties';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const SpecialtyDetails = () => {
    const { id } = useParams();
    const { t: tSpecialties } = useTranslation('specialties');
    const { t: tDetails } = useTranslation('specialtyDetails');

    const specialty = specialties.find((item) => item.id === id);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    return (
        <div className={cx('container')}>
            <aside>
                {specialties.map((item) => (
                    <Link
                        key={item.id}
                        className={cx('tab', { active: id === item.id })}
                        to={`/specialties/${item.id}`}
                    >
                        {tSpecialties(`${item.id}.name`)}
                    </Link>
                ))}
            </aside>
            <main>
                {/* Header section */}
                <header>
                    <h1>
                        {tSpecialties(`${id}.name`)} ({tSpecialties(`${id}.abbreviation`)})
                    </h1>
                    <img src={specialty.image} alt={tSpecialties(`${id}.name`)} />
                </header>

                {/* Description */}
                <div className={cx('overview')}>
                    <h2>{tDetails('overview')}</h2>
                    <p>{tSpecialties(`${id}.description`)}</p>
                </div>

                {/* Subspecialties */}
                <div className={cx('subspecialties')}>
                    <h2>{tDetails('subspecialtiesTitle')}</h2>
                    <div className={cx('subspecialties-grid')}>
                        {tSpecialties(`${id}.subspecialties`, { returnObjects: true }).map((sub, index) => (
                            <div key={index} className={cx('subspecialty-card')}>
                                <h3>{sub.name}</h3>
                                <p>{sub.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Functions */}
                <div className={cx('key-functions')}>
                    <h2>{tDetails('keyFunctionsTitle')}</h2>
                    <div className={cx('functions-grid')}>
                        {tSpecialties(`${id}.keyFunctions`, { returnObjects: true }).map((func, index) => (
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
                    <h2>{tDetails('clinicalWorkflowTitle')}</h2>
                    <div className={cx('workflow')}>
                        {tSpecialties(`${id}.clinicalWorkflow.phases`, { returnObjects: true }).map((phase, index) => (
                            <div key={index} className={cx('phase')}>
                                <h3 data-phase={index + 1}>{phase.stage}</h3>
                                <div className={cx('phase-content')}>
                                    <div className={cx('steps')}>
                                        <h4>{tDetails('procedureSteps')}</h4>
                                        <ol>
                                            {phase.steps.map((step, i) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div className={cx('quality-control')}>
                                        <h4>{tDetails('qualityAssurance')}</h4>
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
