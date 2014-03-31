/*
 * coap parameters
 */

var params = {
  ackTimeout: 2000,      // ms
  ackRandomFactor: 1.5, 
  maxRetransmit: 4,
  nstart: 1,
  defaultLeisure: 5000,  // ms
  probingRate: 1,        // byte/s
  maxLatency: 100 * 1000 // ms
};

/*
 * MAX_TRANSMIT_SPAN is the maximum time from the first transmission
 * of a Confirmable message to its last retransmission
 */
params.maxTransmitSpan = params.ackTimeout * (Math.pow(2, params.maxRetransmit) - 1) * params.ackRandomFactor;

/*
 * MAX_TRANSMIT_WAIT is the maximum time from the first transmission
 * of a Confirmable message to the time when the sender gives up on
 * receiving an acknowledgement or reset
 */
params.maxTransmitWait = params.ackTimeout * (Math.pow(2, params.maxRetransmit + 1) - 1) * params.ackRandomFactor;

/*
 * PROCESSING_DELAY is the time a node takes to turn around a
 * Confirmable message into an acknowledgement
 */
params.processingDelay = params.ackTimeout;

/*
 * PROCESSING_DELAY is the time a node takes to turn around a
 * Confirmable message into an acknowledgement
 */
params.maxRtt = (2 * params.maxLatency) + params.processingDelay;

/*
 * EXCHANGE_LIFETIME is the time from starting to send a Confirmable
 * message to the time when an acknowledgement is no longer expected,
 * i.e.  message layer information about the message exchange can be
 * purged.
 */
params.exchangeLifetime = params.maxTransmitSpan + (2 * params.maxLatency) + params.processingDelay;

/*
 * NON_LIFETIME is the time from sending a Non-confirmable message to
 * the time its Message ID can be safely reused
 */
params.nonLifetime = params.maxTransmitSpan + params.maxLatency;

module.exports = params;
