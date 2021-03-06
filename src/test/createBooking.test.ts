import Contract from "../contract/Contract"
import dotenv from "dotenv"
import * as db from "../util/dbHandler"
import IBookingDetail from "contract/src/DTO/IBookingDetail"
import { InputError, NotFoundError } from "../error"
import IReservationDetail from "contract/src/DTO/IReservationDetail"
import IPassenger from "contract/src/IPassenger"
import BookingError from "../error/BookingError"
import IAirportIdentifier from "contract/src/IAirportIdentifier"

const contract: Contract = new Contract()
let populatedValues: any

beforeAll(async () => {
  dotenv.config()
  await db.connect(process.env.TEST_CONNECTION_STRING, true)
})

beforeEach(async () => {
  await db.drop()
  populatedValues = await db.populate()
})

afterAll(async () => {
  await db.drop()
  await db.disconnect()
})

describe("Success scenarios", () => {
  test("Integrity of booking creation", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }
    const passengers: IPassenger[] = [passenger1, passenger2]
    const reservation: IReservationDetail = {
      id,
      passengers,
    }
    const reservations: IReservationDetail[] = [reservation]
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "1234567"

    const expectedPrice: number = 138
    const expectedFlightCode: string = "FR002"
    const expectedDepartureDate: number = 1606809600000
    const expectedArrivalDate: number = 1606815000000
    const expectedCarrierIATA: string = "FR"
    const expectedCarrierName: string = "Ryanair"
    const departureAirport: IAirportIdentifier = { iata: "LHR" }
    const arrivalAirport: IAirportIdentifier = { iata: "CPH" }

    //act
    const booking: IBookingDetail = await contract.createBooking(reservations, creditCardNumber, frequentFlyerNumber)

    //assert
    await expect(booking.creditCardNumber).toBe(creditCardNumber)
    await expect(booking.frequentFlyerId).toBe(frequentFlyerNumber)
    await expect(booking.price).toBe(expectedPrice)
    await expect(booking.flightBookings.length).toBe(reservations.length)
    await expect(booking.flightBookings[0].passengers.length).toBe(passengers.length)
    await expect(booking.flightBookings[0].passengers[0].firstName).toBe(passengers[0].firstName)
    await expect(booking.flightBookings[0].passengers[0].lastName).toBe(passengers[0].lastName)
    await expect(booking.flightBookings[0].passengers[1].firstName).toBe(passengers[1].firstName)
    await expect(booking.flightBookings[0].passengers[1].lastName).toBe(passengers[1].lastName)
    await expect(booking.flightBookings[0].flightCode).toBe(expectedFlightCode)
    await expect(booking.flightBookings[0].departureDate).toBe(expectedDepartureDate)
    await expect(booking.flightBookings[0].arrivalDate).toBe(expectedArrivalDate)
    await expect(booking.flightBookings[0].carrier.iata).toBe(expectedCarrierIATA)
    await expect(booking.flightBookings[0].carrier.name).toBe(expectedCarrierName)
    await expect(booking.flightBookings[0].departureAirport.iata).toBe(departureAirport.iata)
    await expect(booking.flightBookings[0].arrivalAirport.iata).toBe(arrivalAirport.iata)
  })

  test("Integrity of booking creation with multiple reservations", async () => {
    //arrange
    const id1: string = populatedValues.reservationIds[0] //defined with amountOfSeats: 3
    const id2: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }
    const passenger3: IPassenger = { firstName: "Morten", lastName: "Wonnegut" }
    const passenger4: IPassenger = { firstName: "Sean", lastName: "Poul" }
    const passenger5: IPassenger = { firstName: "Henning", lastName: "Poul" }

    const passengers1: IPassenger[] = [passenger1, passenger2, passenger3]
    const passengers2: IPassenger[] = [passenger4, passenger5]

    const reservation1: IReservationDetail = {
      id: id1,
      passengers: passengers1,
    }

    const reservation2: IReservationDetail = {
      id: id2,
      passengers: passengers2,
    }

    const reservations: IReservationDetail[] = [reservation1, reservation2]
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "1234567"

    const expectedPrice: number = 1668

    //act
    const booking: IBookingDetail = await contract.createBooking(reservations, creditCardNumber, frequentFlyerNumber)

    //assert
    await expect(booking.price).toBe(expectedPrice)
    await expect(booking.flightBookings.length).toBe(reservations.length)
    await expect(booking.flightBookings[0].passengers.length).toBe(passengers1.length)
    await expect(booking.flightBookings[1].passengers.length).toBe(passengers2.length)
  })
})

describe("Fail scenarios", () => {
  test("Using empty reservation list", async () => {
    //arrange
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "1234567"

    //act
    const action = async () => {
      await contract.createBooking([], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(InputError)
  })

  test("Using an invalid reservation", async () => {
    //arrange
    const id: string = "XXXXXXXXXXXXXXXX"
    const passenger: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const reservation: IReservationDetail = {
      id,
      passengers: [passenger],
    }
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "1234567"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(NotFoundError)
  })

  test("Using empty passenger list", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const reservation: IReservationDetail = {
      id,
      passengers: [],
    }
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "1234567"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(BookingError)
  })

  test("Using too many passengers", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }
    const passenger3: IPassenger = { firstName: "Jens", lastName: "Wonnegut" }

    const reservation: IReservationDetail = {
      id,
      passengers: [passenger1, passenger2, passenger3],
    }
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "1234567"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(BookingError)
  })

  test("Using too few passengers", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[0] //defined with amountOfSeats: 3
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }

    const reservation: IReservationDetail = {
      id,
      passengers: [passenger1, passenger2],
    }
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "1234567"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(BookingError)
  })

  test("Credit card is too short", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }

    const reservation: IReservationDetail = {
      id,
      passengers: [passenger1, passenger2],
    }
    const creditCardNumber: number = 123456789123456
    const frequentFlyerNumber: string = "1234567"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(InputError)
  })

  test("Credit card is too long", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }

    const reservation: IReservationDetail = {
      id,
      passengers: [passenger1, passenger2],
    }
    const creditCardNumber: number = 12345678912345678
    const frequentFlyerNumber: string = "1234567"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(InputError)
  })

  test("Frequent flyer number is too short", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }

    const reservation: IReservationDetail = {
      id,
      passengers: [passenger1, passenger2],
    }
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "123456"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(InputError)
  })

  test("Frequent flyer number is too long", async () => {
    //arrange
    const id: string = populatedValues.reservationIds[1] //defined with amountOfSeats: 1
    const passenger1: IPassenger = { firstName: "Kurt", lastName: "Wonnegut" }
    const passenger2: IPassenger = { firstName: "Yvonne", lastName: "Wonnegut" }

    const reservation: IReservationDetail = {
      id,
      passengers: [passenger1, passenger2],
    }
    const creditCardNumber: number = 1234567891234567
    const frequentFlyerNumber: string = "12345678"

    //act
    const action = async () => {
      await contract.createBooking([reservation], creditCardNumber, frequentFlyerNumber)
    }

    //assert
    await expect(action).rejects.toThrow(InputError)
  })
})
