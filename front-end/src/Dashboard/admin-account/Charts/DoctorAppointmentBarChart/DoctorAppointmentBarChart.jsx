import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import classNames from 'classnames/bind';
import styles from './DoctorAppointmentBarChart.module.scss';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const DoctorAppointmentBarChart = ({ doctorChart }) => {
    const [selectedTime, setSelectedTime] = useState('month');
    const [selectedStatus, setSelectedStatus] = useState('Successful');
    const [data, setData] = useState([]);

    useEffect(() => {
        const loadCSVData = async () => {
            const response = await fetch('/data/Healmate_Appointment_Record_2023.csv');
            const rawData = await response.text();
            const parsedData = d3.csvParse(rawData);
            setData(parsedData);
        };

        loadCSVData();
    }, []);

    useEffect(() => {
        if (data.length > 0) {
            const filteredData = data.filter((d) => d.Doctor === doctorChart);

            let preparedData;

            if (selectedTime === 'month') {
                preparedData = filteredData.map((d) => {
                    return {
                        time: d.Month,
                        old: +d[`${selectedStatus}_Old`],
                        new: +d[`${selectedStatus}_New`],
                    };
                });
            } else if (selectedTime === 'quarter') {
                const groupedData = d3.group(filteredData, (d) => d.Quarter);

                preparedData = Array.from(groupedData, ([key, values]) => {
                    return {
                        time: key,
                        old: d3.sum(values, (d) => +d[`${selectedStatus}_Old`]),
                        new: d3.sum(values, (d) => +d[`${selectedStatus}_New`]),
                    };
                });
            }

            drawChart(preparedData);
        }
    }, [data, doctorChart, selectedTime, selectedStatus]);

    const drawChart = (data) => {
        const margin = { top: 120, right: 30, bottom: 60, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 550 - margin.top - margin.bottom;

        // Remove any existing svg
        d3.select('#stackedBarChart').selectAll('*').remove();

        const svg = d3
            .select('#stackedBarChart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title
        svg.append('text')
            .attr('x', width / 2 - 20)
            .attr('y', -margin.top / 2 - 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '26px')
            .style('font-weight', 'bold')
            .text(`Number of patients registered to see Dr. ${doctorChart} in 2023`);

        // Add legend
        const legend = svg
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${margin.left * 4}, -${margin.top / 2})`);

        // Old Patients legend
        legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 20).attr('height', 20).style('fill', '#feb60d');

        legend
            .append('text')
            .attr('x', 30)
            .attr('y', 9)
            .attr('dy', '0.4em')
            .style('text-anchor', 'start')
            .style('font-size', '18')
            .text('Old Patients');

        // New Patients legend
        legend.append('rect').attr('x', 200).attr('y', 0).attr('width', 20).attr('height', 20).style('fill', '#30d5c8');

        legend
            .append('text')
            .attr('x', 230)
            .attr('y', 9)
            .attr('dy', '0.4em')
            .style('text-anchor', 'start')
            .style('font-size', '18')
            .text('New Patients');

        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.time))
            .range([0, width])
            .padding(0.25);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.old + d.new)])
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal().domain(['old', 'new']).range(['#feb60d', '#30d5c8']);

        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('text-align', 'center')
            .style('width', '80px')
            .style('height', '28px')
            .style('padding', '5px 2px 0 2px')
            .style('font-size', '12px')
            .style('background', 'lightsteelblue')
            .style('border', '0px')
            .style('border-radius', '8px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 9999);

        svg.append('g')
            .selectAll('g')
            .data(d3.stack().keys(['old', 'new'])(data))
            .enter()
            .append('g')
            .attr('fill', (d) => color(d.key))
            .selectAll('rect')
            .data((d) => d)
            .enter()
            .append('rect')
            .attr('x', (d) => x(d.data.time))
            .attr('y', y(0))
            .attr('height', 0)
            .attr('width', x.bandwidth())
            .on('mouseover', function (event, d) {
                d3.select(this).style('opacity', 0.8);
                tooltip.transition().duration(200).style('opacity', 0.9);
                tooltip
                    .html(`${d[1] - d[0]} patients`)
                    .style('left', event.pageX + 5 + 'px')
                    .style('top', event.pageY - 30 + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).style('opacity', 1);
                tooltip.transition().duration(500).style('opacity', 0);
            })
            .transition()
            .duration(750)
            .attr('y', (d) => y(d[1]))
            .attr('height', (d) => y(d[0]) - y(d[1]))
            .on('end', function (d, i) {
                if (i === data.length - 1) {
                    svg.append('g')
                        .selectAll('text')
                        .data(data)
                        .enter()
                        .append('text')
                        .attr('x', (d) => x(d.time) + x.bandwidth() / 2)
                        .attr('y', (d) => y(d.old + d.new) - 10)
                        .attr('text-anchor', 'middle')
                        .style('font-size', '14px')
                        .text((d) => d.old + d.new);
                }
            });

        // Add X Axis
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style('font-size', '14px');

        // Add X Axis Label
        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom / 2 + 15)
            .text(`${selectedTime.toUpperCase()}`)
            .style('font-weight', '500');

        // Add Y Axis
        svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y)).style('font-size', '14px');

        // Add Y Axis Label
        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left / 2 - 15)
            .text('NUMBER OF PATIENTS')
            .style('font-weight', '500');
    };

    return (
        <div className={cx('container')}>
            <div className={cx('selections')}>
                <div className={cx('selection')}>
                    <h4>Time</h4>
                    <select name="time" id="time" onChange={(e) => setSelectedTime(e.target.value)}>
                        <option value="month">Month</option>
                        <option value="quarter">Quarter</option>
                    </select>
                </div>
                <div className={cx('selection')}>
                    <h4>Appointment Status</h4>
                    <select name="status" id="status" onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="Successful">Successful</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
            <div className={cx('chart')}>
                <div id="stackedBarChart"></div>
            </div>
        </div>
    );
};

DoctorAppointmentBarChart.propTypes = {
    doctorChart: PropTypes.string.isRequired,
};

export default DoctorAppointmentBarChart;
