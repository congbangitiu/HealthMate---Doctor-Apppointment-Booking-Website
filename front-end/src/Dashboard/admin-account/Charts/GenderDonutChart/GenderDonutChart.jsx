import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import classNames from 'classnames/bind';
import styles from './GenderDonutChart.module.scss';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const GenderDonutChart = ({ genderCount }) => {
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
                { label: 'Male', value: data.maleDoctors + data.malePatients },
                { label: 'Female', value: data.femaleDoctors + data.femalePatients },
            ];
        } else if (role === 'doctor') {
            genderData = [
                { label: 'Male', value: data.maleDoctors },
                { label: 'Female', value: data.femaleDoctors },
            ];
        } else {
            genderData = [
                { label: 'Male', value: data.malePatients },
                { label: 'Female', value: data.femalePatients },
            ];
        }

        const color = d3.scaleOrdinal().domain(['Male', 'Female']).range(['#87CEEB', '#FFC0CB']);

        const pie = d3.pie().value((d) => d.value);

        const path = d3
            .arc()
            .outerRadius(radius - 5)
            .innerRadius(radius - 50);

        const labelArcMale = d3
            .arc()
            .outerRadius(radius - 45)
            .innerRadius(radius - 20);

        const labelArcFemale = d3
            .arc()
            .outerRadius(radius - 30)
            .innerRadius(radius - 20);

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
            });

        arc.append('text')
            .attr('transform', (d) => {
                if (d.data.label === 'Male') {
                    return `translate(${labelArcMale.centroid(d)})`;
                } else {
                    return `translate(${labelArcFemale.centroid(d)})`;
                }
            })
            .attr('dy', '0.35em')
            .text((d) => `${d.data.value}`)
            .style('font-size', '14px')
            .style('font-weight', '500');

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
                <h4>Gender</h4>
                <select name="role" id="role" onChange={(e) => setRole(e.target.value)}>
                    <option value="all">All</option>
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
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
