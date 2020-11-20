import IContract from "contract";
import IAirportDetail from "contract/src/DTO/IAirportDetail";
import IBookingDetail from "contract/src/DTO/IBookingDetail";
import ICarrierDetail from "contract/src/DTO/ICarrierDetail";
import IFlightSummary from "contract/src/DTO/IFlightSummary";
import IReservationDetail from "contract/src/DTO/IReservationDetail";
import IReservationSummary from "contract/src/DTO/IReservationSummary";
import { NotFoundError } from "../error";
import IAirportIdentifier from "contract/src/IAirportIdentifier";
import IBookingIdentifier from "contract/src/IBookingIdentifier";
import IFlightIdentifier from "contract/src/IFlightIdentifier";
import Carrier from "../schema/Carrier";

export default class Contract implements IContract {
  async getCarrierInformation(iata: string): Promise<ICarrierDetail> {
    const carrier: ICarrierDetail | null = await Carrier.findOne({ iata });
    if (!carrier) {
      throw new NotFoundError(`Could not find Carrier Information for IATA: ${iata}`);
    }
    return carrier;
  }

  getAirportInformation(iata: string): Promise<IAirportDetail> {
    throw new Error("Method not implemented.");
  }
  getFlightsAvailable(departure: IAirportIdentifier, arrival: IAirportIdentifier, depart: number): Promise<IFlightSummary[]> {
    throw new Error("Method not implemented.");
  }
  reserveFlight(id: IFlightIdentifier, amountSeats: number): Promise<IReservationSummary> {
    throw new Error("Method not implemented.");
  }
  createBooking(reservationDetails: IReservationDetail[], creditCardNumber: number, frequentFlyerNumber?: number): Promise<IBookingDetail> {
    throw new Error("Method not implemented.");
  }
  getBooking(id: IBookingIdentifier): Promise<IBookingDetail> {
    throw new Error("Method not implemented.");
  }
  cancelBooking(id: IBookingIdentifier): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
