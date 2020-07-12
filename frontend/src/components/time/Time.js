import React, { useState, useEffect } from 'react';
import './Time.css';

// React Time Component
const Time = () => {
    // React hook state values
    const [time, setTime] = useState ('');
    const [day, setDay] = useState ('');
    const [month, setMonth] = useState ('');
    const [year, setYear] = useState ('');
    const [weekDay, setWeekDay] = useState ('');

    // Start time function which sets React hook values
    const startTime = () => {
        let weekday = new Date().getDay();
        switch (weekday) {
            case 0:
                weekday = "Sunday";
                break;
            case 1:
                weekday = "Monday";
                break;
            case 2:
                weekday = "Tuesday";
                break;
            case 3:
                weekday = "Wednesday";
                break;
            case 4:
                weekday = "Thursday";
                break;
            case 5:
                weekday = "Friday";
                break;
            case 6:
                weekday = "Saturday";
                break;
            default:
                weekday = "Unknown";
        }

        let today = new Date();
        setTime(today.toLocaleTimeString());
        setDay(today.getDate());
        setMonth(today.getMonth() + 1);
        setYear(today.getFullYear());
        setWeekDay(weekday);
    }

    // Call startTime function and start the clock. Interval every second.
    useEffect(() => {
        const startClock = setInterval(() => { // Run clock with interval of 1 second
            startTime()
        }, 1000);

        return () => clearInterval(startClock); // Stop clock after leaving page (this is the cleanup function)
    }, []);

    return(
    <div className="time">
        <div className="clock">{time}</div>
        <div className="day">{day}</div>
        <span className="month">{month}</span>
        <span className="year">/{year}</span>
        <div className="weekday">{weekDay}</div>
    </div>
    )
}

export default Time;
