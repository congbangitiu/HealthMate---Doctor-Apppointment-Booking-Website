import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import classNames from 'classnames/bind';
import styles from './AppointmentBarChart.module.scss';

const cx = classNames.bind(styles);

const AppointmentBarChart = () => {
    const doctors = ['John Smith', 'Emily Johnson', 'James Smith', 'David Brown', 'Emily Davis', 'Sarah Wilson'];
    const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]);
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
            const filteredData = data.filter((d) => d.Doctor === selectedDoctor);

            // Prepare data based on selected time (month or quarter) and status (Successful or Cancelled)
            const preparedData = filteredData.map((d) => {
                return {
                    time: selectedTime === 'month' ? d.Month : d.Quarter,
                    old: +d[`${selectedStatus}_Old`],
                    new: +d[`${selectedStatus}_New`],
                };
            });

            drawChart(preparedData);
        }
    }, [data, selectedDoctor, selectedTime, selectedStatus]);

    const drawChart = (data) => {
        const margin = { top: 100, right: 30, bottom: 60, left: 60 };
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
            .attr('y', -margin.top / 2 - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .text(`Stacked bar chart showing number of patients scheduled for appointments in 2023`);

        // Add legend
        const legend = svg
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${margin.left * 4}, -${margin.top / 2 - 10})`); // Adjust position to be below the title

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
            .transition()
            .duration(750)
            .attr('y', (d) => y(d[1]))
            .attr('height', (d) => y(d[0]) - y(d[1]));

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
                    <h4>Doctor</h4>
                    <select name="doctor" id="doctor" onChange={(e) => setSelectedDoctor(e.target.value)}>
                        {doctors.map((doctor, index) => (
                            <option key={index} value={doctor}>
                                {doctor}
                            </option>
                        ))}
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

export default AppointmentBarChart;
