import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import classNames from 'classnames/bind';
import styles from './DoctorRevenueBarChart.module.scss';
import { PropTypes } from 'prop-types';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const DoctorRevenueBarChart = ({ doctors }) => {
    const { t, i18n } = useTranslation('revenueManagement');
    const [selectedTime, setSelectedTime] = useState('month');
    const [selectedDoctor, setSelectedDoctor] = useState(doctors.length > 0 ? doctors[0].fullname : '');
    const [data, setData] = useState([]);

    const officialDoctors = doctors.filter((doctor) => doctor.isApproved === 'approved');

    useEffect(() => {
        const loadCSVData = async () => {
            const response = await fetch('/mock-data/Healmate_Appointment_Record_2024.csv');
            const rawData = await response.text();
            const parsedData = d3.csvParse(rawData);
            setData(parsedData);
        };

        loadCSVData();
    }, []);

    useEffect(() => {
        if (data.length > 0 && selectedDoctor) {
            const filteredData = data.filter((d) => d.Doctor === selectedDoctor);

            let preparedData;

            if (selectedTime === 'month') {
                preparedData = filteredData.map((d) => {
                    const fee = +d.Fee;
                    return {
                        time: d.Month,
                        oldRevenue: (+d.Successful_Old + +d.Cancelled_Old) * fee,
                        newRevenue: (+d.Successful_New + +d.Cancelled_New) * fee,
                    };
                });
            } else if (selectedTime === 'quarter') {
                const groupedData = d3.group(filteredData, (d) => d.Quarter);

                preparedData = Array.from(groupedData, ([key, values]) => {
                    const totalOldRevenue = d3.sum(values, (d) => (+d.Successful_Old + +d.Cancelled_Old) * +d.Fee);
                    const totalNewRevenue = d3.sum(values, (d) => (+d.Successful_New + +d.Cancelled_New) * +d.Fee);
                    return {
                        time: key,
                        oldRevenue: totalOldRevenue,
                        newRevenue: totalNewRevenue,
                    };
                });
            }

            drawChart(preparedData);
        }
    }, [data, selectedDoctor, selectedTime, i18n.language]);

    const drawChart = (data) => {
        const margin = { top: 120, right: 30, bottom: 60, left: 100 };
        const width = 1050 - margin.left - margin.right;
        const height = 550 - margin.top - margin.bottom;

        // Remove old SVG
        d3.select('#doctorRevenueBarChart').selectAll('*').remove();

        const svg = d3
            .select('#doctorRevenueBarChart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title
        svg.append('text')
            .attr('x', width / 2 - 20)
            .attr('y', -margin.top / 2 - 35)
            .attr('text-anchor', 'middle')
            .style('font-size', '26px')
            .style('font-weight', 'bold')
            .text(
                t('doctorRevenueBarChart.title', {
                    time:
                        selectedTime === 'month'
                            ? t('doctorRevenueBarChart.selections.month')
                            : t('doctorRevenueBarChart.selections.quarter'),
                    doctor: selectedDoctor,
                }),
            );

        // Add legend
        const legend = svg
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${margin.left * 2.5}, -${margin.top / 1.75})`);

        legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 20).attr('height', 20).style('fill', '#feb60d');

        legend
            .append('text')
            .attr('x', 30)
            .attr('y', 9)
            .attr('dy', '0.4em')
            .style('text-anchor', 'start')
            .style('font-size', '18')
            .text(t('doctorRevenueBarChart.legend.oldPatients'));

        legend.append('rect').attr('x', 200).attr('y', 0).attr('width', 20).attr('height', 20).style('fill', '#30d5c8');

        legend
            .append('text')
            .attr('x', 230)
            .attr('y', 9)
            .attr('dy', '0.4em')
            .style('text-anchor', 'start')
            .style('font-size', '18')
            .text(t('doctorRevenueBarChart.legend.newPatients'));

        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.time))
            .range([0, width])
            .padding(0.25);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.oldRevenue + d.newRevenue)])
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal().domain(['oldRevenue', 'newRevenue']).range(['#feb60d', '#30d5c8']);

        // Add tooltip
        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('text-align', 'center')
            .style('width', '80px')
            .style('height', '28px')
            .style('padding', '5px 2px 0 2px')
            .style('font-size', '14px')
            .style('background', 'lightsteelblue')
            .style('border', '0px')
            .style('border-radius', '8px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        svg.append('g')
            .selectAll('g')
            .data(d3.stack().keys(['oldRevenue', 'newRevenue'])(data))
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
                    .html(t('doctorRevenueBarChart.tooltip', { value: (d[1] - d[0]).toLocaleString() }))
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
                        .attr('y', (d) => y(d.oldRevenue + d.newRevenue) - 10)
                        .attr('text-anchor', 'middle')
                        .style('font-size', '14px')
                        .text((d) => `${(d.oldRevenue + d.newRevenue).toLocaleString()}`);
                }
            });

        // Add X-axis
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(
                d3.axisBottom(x).tickFormat((d) => {
                    if (selectedTime === 'month') {
                        return t(`doctorRevenueBarChart.ticks.months.${d}`);
                    } else if (selectedTime === 'quarter') {
                        return t(`doctorRevenueBarChart.ticks.quarters.${d}`);
                    }
                    return d;
                }),
            )
            .style('font-size', '14px');

        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom / 2 + 25)
            .text(
                selectedTime === 'month'
                    ? t('doctorRevenueBarChart.selections.month').toUpperCase()
                    : t('doctorRevenueBarChart.selections.quarter').toUpperCase(),
            )
            .style('font-weight', '500');

        // Add Y-axis
        svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y)).style('font-size', '14px');

        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left / 2 - 35)
            .text(t('doctorRevenueBarChart.axis.y'))
            .style('font-weight', '500');
    };

    return (
        <div className={cx('container')}>
            <div className={cx('selections')}>
                <div className={cx('selection')}>
                    <h4>{t('doctorRevenueBarChart.selections.timeLabel')}</h4>
                    <select name="time" id="time" onChange={(e) => setSelectedTime(e.target.value)}>
                        <option value="month">{t('doctorRevenueBarChart.selections.month')}</option>
                        <option value="quarter">{t('doctorRevenueBarChart.selections.quarter')}</option>
                    </select>
                </div>
                <div className={cx('selection')}>
                    <h4>{t('doctorRevenueBarChart.selections.doctorLabel')}</h4>
                    <select
                        name="doctor"
                        id="doctor"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                    >
                        <option value="">{t('doctorRevenueBarChart.selections.chooseDoctor')}</option>
                        {officialDoctors.map((doctor) => (
                            <option key={doctor.index} value={doctor.fullname}>
                                {doctor.fullname}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className={cx('chart')}>
                <div id="doctorRevenueBarChart"></div>
            </div>
        </div>
    );
};

DoctorRevenueBarChart.propTypes = {
    doctors: PropTypes.array.isRequired,
};

export default DoctorRevenueBarChart;
