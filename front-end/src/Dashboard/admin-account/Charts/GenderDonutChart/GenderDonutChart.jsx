import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import classNames from 'classnames/bind';
import styles from './GenderDonutChart.module.scss';
import { PropTypes } from 'prop-types';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const GenderDonutChart = ({ genderCount }) => {
    const { t } = useTranslation('dashboardManagement');
    const [role, setRole] = useState('all');
    const data = {
        maleDoctors: genderCount.doctors.male,
        femaleDoctors: genderCount.doctors.female,
        malePatients: genderCount.users.male,
        femalePatients: genderCount.users.female,
    };

    useEffect(() => {
        drawChart();
    }, [role, data]);

    const drawChart = () => {
        const width = 300;
        const height = 280;
        const radius = Math.min(width, height) / 2.5;

        // Remove any existing svg
        d3.select('#donutChart').selectAll('*').remove();

        const svg = d3
            .select('#donutChart')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2.3})`);

        let genderData;
        if (role === 'all') {
            genderData = [
                { label: t('genderDonutChart.legend.male'), value: data.maleDoctors + data.malePatients },
                { label: t('genderDonutChart.legend.female'), value: data.femaleDoctors + data.femalePatients },
            ];
        } else if (role === 'doctor') {
            genderData = [
                { label: t('genderDonutChart.legend.male'), value: data.maleDoctors },
                { label: t('genderDonutChart.legend.female'), value: data.femaleDoctors },
            ];
        } else {
            genderData = [
                { label: t('genderDonutChart.legend.male'), value: data.malePatients },
                { label: t('genderDonutChart.legend.female'), value: data.femalePatients },
            ];
        }

        const color = d3.scaleOrdinal().domain(['Male', 'Female']).range(['#87CEEB', '#FFC0CB']);

        const pie = d3.pie().value((d) => d.value);

        const path = d3
            .arc()
            .outerRadius(radius - 5)
            .innerRadius(radius - 50);

        const arc = svg.selectAll('.arc').data(pie(genderData)).enter().append('g').attr('class', 'arc');

        arc.append('path')
            .attr('d', path)
            .attr('fill', (d) => color(d.data.label))
            .transition()
            .duration(750)
            .attrTween('d', function (d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function (t) {
                    return path(interpolate(t));
                };
            })
            .on('end', function (d) {
                // Delay text appearance until after the animation
                setTimeout(() => {
                    arc.append('text')
                        .attr('transform', () => `translate(${path.centroid(d)})`)
                        .attr('dx', '-0.3em')
                        .attr('dy', '0.1em')
                        .text(d.data.value)
                        .style('font-size', '14px');
                }, 100);
            });

        // Add legend
        const legend = svg
            .append('g')
            .attr('transform', `translate(-90,${radius + 20})`)
            .selectAll('.legend')
            .data(genderData)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(${i * 110}, 0)`);

        legend
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', (d) => color(d.label));

        legend
            .append('text')
            .attr('x', 25)
            .attr('y', 9)
            .attr('dy', '0.35em')
            .style('text-anchor', 'start')
            .style('font-size', '16px')
            .text((d) => d.label);
    };

    return (
        <div className={cx('container')}>
            <div className={cx('intro')}>
                <h4>{t('genderDonutChart.title')}</h4>
                <select name="role" id="role" onChange={(e) => setRole(e.target.value)}>
                    <option value="all">{t('genderDonutChart.selectRole.all')}</option>
                    <option value="doctor">{t('genderDonutChart.selectRole.doctor')}</option>
                    <option value="patient">{t('genderDonutChart.selectRole.patient')}</option>
                </select>
            </div>
            <div className={cx('chart')}>
                <div id="donutChart"></div>
            </div>
        </div>
    );
};

GenderDonutChart.propTypes = {
    genderCount: PropTypes.object.isRequired,
};

export default GenderDonutChart;
