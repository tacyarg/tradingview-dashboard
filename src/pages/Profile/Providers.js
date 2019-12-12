import React, { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Flex,
  Box,
  Text,
  Image,
  Heading,
  Sidebar,
  Spinner,
  Input,
  Divider,
} from '../../primitives'
import Utils from '../../components/Utils'
import { ReferenceLine, LabelList, BarChart, LineChart, XAxis, YAxis, Legend, Bar, Line, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import moment from 'moment'
import VizSensor from 'react-visibility-sensor';
import Modal from '../../components/Modal'

const ProviderEventHistory = ({ listMyProviderTrades = async x => x }) => {

  const [isVisable, setIsVisable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState([])

  const PopulateState = () => {
    // if (state.length > 0) return
    setLoading(true)
    listMyProviderTrades().then(trades => {
      console.log('t', trades)

      let data = trades.reduce((memo, t) => {
        if (!t.done) return memo
        const date = moment(t.updated).format('l');

        if (!memo[date]) {
          memo[date] = {

            date,
            profit: t.profit,
            // updated: t.created
          }
        } else {
          memo[date].updated = t.created
          memo[date].profit += t.profit
        }

        return memo
      }, {})

      // let data = trades.map(t => {
      //   const date = moment(t.updated).format('l');
      //   return {
      //     date,
      //     profit: t.profit,
      //     updated: t.created
      //   }
      // })

      data = Object.values(data).sort((x, y) => {
        return x.updated > y.updated ? 1 : -1
      })
      // .slice(0,6)

      console.log('d', data)

      setState(data)
      setLoading(false)
    })
  }

  // useEffect(PopulateState, [])

  return <VizSensor
    scrollCheck
    partialVisibility
    onChange={vis => {
      console.log('can see', vis)
      if (vis) PopulateState()
      setIsVisable(vis)
    }}
  >
    {props => {
      if (loading) return <Utils.LoadingPage />
      return isVisable && state.length > 1 ? <Box height="100%">
        <Text m={2} fontSize={3}>Recent Trade History</Text>
        <Divider bg="primary" />
        <Flex
          m={2}
          height="100%"
          width={1}
          justifyContent='center'
          alignItems="center"
        >
          <ResponsiveContainer width="90%" height={'90%'} aspect={3}>
            <LineChart
              // width={900}
              // height={420}
              data={state}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis name="Date" dataKey="date" />
              <YAxis />
              <Tooltip payload={state} />
              <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
              <Legend />
              {/* <Bar dataKey="count" fill="#8884d8" /> */}
              <Line name="Profit" dataKey="profit" fill="#82ca9d" >
                {/* <LabelList dataKey="profit" position="top"  /> */}
              </Line>
            </LineChart>
          </ ResponsiveContainer >
        </Flex>
      </Box> : <Flex
        height="100%"
        width={1}
        justifyContent='center'
        alignItems="center"
      ><Text>Nothing to display.</Text></Flex>
    }}
  </VizSensor>
}

const CreateProviderModal = ({ actions }) => {

  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [state, setState] = useState({})
  const [provider, setProvider] = useState(null)

  const setProp = (k, v) => {
    return setState({
      ...state,
      [k]: v
    })
  }

  const toggleModal = s => {
    setProvider(null)
    setState({})
    return setIsModalOpen(!isModalOpen)
  }

  const CreateProvider = async p => {
    if (!state.username) return
    if (!state.description) return
    if (state.username.length < 3) return
    if (state.description.length < 10) return
    setLoading(true)
    await actions.createProvider(state).then(setProvider).catch(console.error)
    setLoading(false)
  }

  return <>
    <Modal loading={loading} title="Create New Provider" isOpen={isModalOpen} onConfirm={CreateProvider} onClose={toggleModal}>
      <Flex m={4} width={2/3} flexDirection="column" alignItems="center">
        {provider ? <>
          <Text color="red" fontSize={3} p={3}>
            Please ensure you save this information or risk losing your account.
        </Text>
          <Utils.DownloadJson data={provider} />
          <Utils.RenderObject label="Provider" data={provider.provider} />
          <Utils.RenderObject label="Token" data={provider.token} />
        </> : <>
            <Input label="Username:" onChange={e => setProp('username', e.target.value)} value={state.username} />
            <Box my={1} />
            <Input label="Description:" onChange={e => setProp('description', e.target.value)} value={state.description} />
          </>}
      </Flex>
    </Modal>
    <Button type="primary" onClick={toggleModal}>Create New Provider</Button>
  </>
}

const Providers = ({ actions, location }) => {
  const cPage = location.pathname

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState([])
  const [stats, setStats] = useState([])

  useEffect(() => {
    actions
      .listMyProviders()
      .then(s => {
        setState(s)
        setLoading(false)
      })
      .catch(e => {
        setError(e)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const valueProps = ['longs', 'shorts', 'totalTrades', 'longProfit', 'shortProfit', 'profit']
    const memo = state.reduce((memo, data, idx) => {

      if (idx === 0) {
        valueProps.map(v => {
          memo[v] = {
            label: v,
            value: data.stats[v]
          }
        })
      } else {
        valueProps.map(v => {
          memo[v].value += data.stats[v]
        })
      }

      return memo
    }, {})

    console.log("STATS", memo)

    setStats(Object.values(memo))
  }, [state])

  return loading ? (
    <Utils.LoadingPage />
  ) : (
      <Flex
        // flexDirection="column"
        p={4}
        width={1}
        justifyContent="space-evenly"
        flexWrap="wrap"
      >
        <Heading>My Providers</Heading>
        {/* <Banners.Notice>
          <Utils.RenderMarkdown source={MARKDOWN} />
        </Banners.Notice> */}
        <Flex width={1} m={1} alignItems="center">
          {stats.map(s => <Box mx={2}>{`${s.label.toUpperCase()}: ${s.value}`}</Box>)}
          <Box mx="auto" />
          <CreateProviderModal actions={actions} />
        </Flex>
        {state.length > 0 ? (
          state.map(data => {
            return (
              <Box
                width={1}
                my={2}
                key={data.id}
              // bg="darkBacking"
              // borderRadius={2}
              >
                <Flex flex={1}>
                  <Utils.RenderObject
                    heading={data.username.toUpperCase()}
                    data={data}
                    flex={1}
                  >
                    <ProviderEventHistory listMyProviderTrades={e => actions.listMyProviderTrades({ providerid: data.id })} />
                  </ Utils.RenderObject>
                  <Box>
                    <Utils.RenderObject
                      heading="Current Stats"
                      data={data.stats}
                      flex={1}
                    />
                    <Utils.RenderObject
                      heading="Current Position"
                      data={data.stats.position}
                      flex={1}
                    />
                  </Box>
                </Flex>
              </Box>
            )
          })
        ) : (
            <Card flexDirection="column" m={2}>
              <Text>No providers are available right now.</Text>
            </Card>
          )}
      </Flex>
    )
}

export default Providers