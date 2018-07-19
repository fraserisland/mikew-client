import React from 'react'
import orderBy from 'lodash.orderby'
import moment from 'moment'
import axios from 'axios'
import Booking from './Booking'
import Loading from './Loading'
import { api } from '../api/init';

const jwtDecode = require('jwt-decode')

class AllBookings extends React.Component {
    state = { 
        bookings: [],
        declinedBookings: [],
        approvedBookings: [],
        pendingBookings: [],
        completedBookings: [],
        cancelledBookings: [],
        loading: false
     }

    componentDidMount(){
        this.setState({loading: true})
        const decoded = jwtDecode(localStorage.getItem('token'))
        decoded.role !== "admin" ? 
            this.getUserBookings(decoded.sub)
            :
            this.getAdminBookings()
    }

    getAdminBookings = () => {
        api.get("bookings")
        .then((response) => {
            let bookings = orderBy(response.data, (o) => { new moment(o.date).format('YYYYMMDD') })
            response.data.forEach((data) => { this.checkBookingStatus(data) })
            this.setState({ bookings, loading: false }) })
        .catch((err) => { console.log(err) })
    }

    getUserBookings = (id) => {
        api.get("users/bookings",{params : {id: id }})
        .then((response) => {
            let bookings = orderBy(response.data, (o) => { new moment(o.date).format('YYYYMMDD') })
            response.data.forEach((data) => { this.checkBookingStatus(data) })
            this.setState({ bookings, loading: false }) })
        .catch((err) => { console.log(err) })
    }

        checkBookingStatus = (booking) => {
            let bookingStatus = booking.bookingStatus
            switch(bookingStatus){
                case "approved":
                    this.setState({ approvedBookings: this.state.approvedBookings.concat(booking) })
                break
                case "declined":
                   this.setState({ declinedBookings: this.state.declinedBookings.concat(booking) })
                break
                case "pending":
                   this.setState({ pendingBookings: this.state.pendingBookings.concat(booking) })
                break
                case "completed":
                    this.setState({ completedBookings: this.state.completedBookings.concat(booking) })
                break
                case "cancelled":
                    this.setState({ cancelledBookings: this.state.cancelledBookings.concat(booking) })
                break
            }
        }

        handleEditBooking = (bookingID) => {
            let copy = this.state[`${bookingID.bookingStatus}`]
            //not functioning
        }

        handleApprovedBooking = (bookingID) => { 
            let bookingsCopy = this.state.pendingBookings
            let approved = this.state.approvedBookings

            bookingsCopy.forEach((obj) => {
                if(obj._id === bookingID){
                    obj.bookingStatus = "approved"
                    approved.push(obj)
                    api.put(`bookings/id`, {id: obj._id , bookingStatus: 'approved'})
                    .then((response) => { console.log(response)})
                    .catch((err) => {console.log(err)})
                }
            })
            bookingsCopy = bookingsCopy.filter((obj) => { 
                return obj.bookingStatus !== "approved";
            })
            this.setState({
                approvedBookings: approved,
                pendingBookings: bookingsCopy
            })
        }


        handleDeclineBooking = (bookingID) => { 
            let bookingsCopy = this.state.pendingBookings
            let declined = this.state.declinedBookings

            bookingsCopy.forEach((obj) => {
                if(obj._id === bookingID){
                    obj.bookingStatus = "declined"
                    declined.push(obj)
                    api.put(`bookings/id`, {id: obj._id , bookingStatus: 'declined'})
                    .then((response) => { console.log(response)})
                    .catch((err) => {console.log(err)})
                }
            })
            bookingsCopy = bookingsCopy.filter((obj) => { 
                return obj.bookingStatus !== "declined";
            })
            this.setState({
                declinedBookings: declined,
                pendingBookings: bookingsCopy
            })
        }

        handleCancelBooking = (bookingID) => { 
            let bookingsCopy = this.state.approvedBookings
            let cancelled = this.state.cancelledBookings

            bookingsCopy.forEach((obj) => {
                if(obj._id === bookingID){
                    obj.bookingStatus = "cancelled"
                    cancelled.push(obj)
                    api.put(`bookings/id`, {id: obj._id , bookingStatus: 'cancelled'})
                    .catch((err) => {console.log(err)})
                }
            })
            bookingsCopy = bookingsCopy.filter((obj) => { 
                return obj.bookingStatus !== "cancelled";
            })
            this.setState({
                declinedBookings: cancelled,
                approvedBookings: bookingsCopy
            })
        }

        readableDate = (date) => ( moment(date, 'YYYYMMDD').format('MMM Do YY') )

    render() { 
        const { loading, completedBookings, declinedBookings, approvedBookings, pendingBookings, cancelledBookings } = this.state
        { if(loading === true){ return <Loading className = "loadingScreen" /> } }  
        return ( 
            <div>
            <h1> Pending Bookings </h1>
            {
                pendingBookings ? 
                pendingBookings.map((booking) => {
                    return (
                        <div key = {booking._id}>  
                            <Booking 
                                date = {this.readableDate(booking.date)} 
                                startTime = {booking.startTime} 
                                endTime = {booking.endTime}
                                bookingStatus = {booking.bookingStatus}
                                info = {booking.info}
                                />
                            <button className="approve-button" onClick={() => this.handleApprovedBooking(booking._id)}> Approve Booking? </button>
                            <button onClick={() => this.handleDeclineBooking(booking._id)}> Decline Booking? </button>
                            <button onClick={() => this.handleEditBooking(booking._id)}> Edit Booking? </button>
                        </div>
                    )
                })
            : <p> No Pending Bookings </p>
            }
            <h1> Approved Bookings </h1>
            {
                approvedBookings ? 
                approvedBookings.map((booking) => {
                    return (
                        <div key = {booking._id}> 
                            <Booking 
                                date = {this.readableDate(booking.date)} 
                                startTime = {booking.startTime} 
                                endTime = {booking.endTime}
                                bookingStatus = {booking.bookingStatus}
                                info = {booking.info}
                            />
                            <button onClick={() => this.handleCancelBooking(booking._id)}> Cancel Booking? </button>
                            <button onClick={() => this.handleEditBooking(booking._id)}> Edit Booking? </button>
                        </div>
                    )
                })
            : <p> No Approved Bookings </p>
            }
            <h1> Declined Bookings </h1>
            {
                declinedBookings ? 
                declinedBookings.map((booking) => {
                    return (
                        <div key = {booking._id}> 
                            <Booking 
                                date = {this.readableDate(booking.date)} 
                                startTime = {booking.startTime} 
                                endTime = {booking.endTime}
                                bookingStatus = {booking.bookingStatus}
                                info = {booking.info}
                            />
                        </div>
                    )
                })
            : <p> No Declined Bookings </p>
            }
            <h1> Completed Bookings </h1>
            {
                completedBookings ? 
                completedBookings.map((booking) => {
                    return (
                        <div key = {booking._id}> 
                            <Booking 
                                date = {this.readableDate(booking.date)} 
                                startTime = {booking.startTime} 
                                endTime = {booking.endTime}
                                bookingStatus = {booking.bookingStatus}
                                info = {booking.info}
                            />
                        </div>
                    )
                })
            : <p> No Completed Bookings </p>
            }
            <h1> Cancelled Bookings </h1>
            {
                cancelledBookings ? 
                cancelledBookings.map((booking) => {
                    return (
                        <div key = {booking._id}> 
                            <Booking 
                                date = {this.readableDate(booking.date)} 
                                startTime = {booking.startTime} 
                                endTime = {booking.endTime}
                                bookingStatus = {booking.bookingStatus}
                                info = {booking.info}
                            />
                        </div>
                    )
                })
            : <p> No Cancelled Bookings </p>
            }
            </div>
         )
    }
}
 
export default AllBookings;