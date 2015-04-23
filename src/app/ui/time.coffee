module.exports = time =
    today: moment().startOf('day')

updateToday = (->
    # every minute
    setTimeout (->
        time.today = moment().startOf('day')
        updateToday()
        return), 60000
    return)()


