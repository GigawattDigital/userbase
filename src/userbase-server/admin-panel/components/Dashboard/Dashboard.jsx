import React, { Component } from 'react'
import { object } from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons'
import dashboardLogic from './logic'
import adminLogic from '../Admin/logic'
import UnknownError from '../Admin/UnknownError'
import { formatSize } from '../../utils'
import EncryptionModeModal from './EncryptionModeModal'
import { FREE_PLAN_USERS_LIMIT } from '../../config'

export default class Dashboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: '',
      activeApps: [],
      deletedApps: [],
      showDeletedApps: false,
      appName: '',
      loading: true,
      loadingApp: false,
      encryptionMode: 'end-to-end',
    }

    this.handleCreateApp = this.handleCreateApp.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleShowDeletedApps = this.handleShowDeletedApps.bind(this)
    this.handleHideDeletedApps = this.handleHideDeletedApps.bind(this)
    this.handlePermanentDeleteApp = this.handlePermanentDeleteApp.bind(this)
    this.handleSetEncryptionMode = this.handleSetEncryptionMode.bind(this)
    this.handleShowEncryptionModeModal = this.handleShowEncryptionModeModal.bind(this)
    this.handleHideEncryptionModeModal = this.handleHideEncryptionModeModal.bind(this)
  }

  async componentDidMount() {
    try {
      this._isMounted = true
      document.addEventListener('keydown', this.handleHitEnter, true)

      const apps = (await dashboardLogic.listApps())
        // sort by app name in ascending order
        .sort((a, b) => {
          const lowerA = a['app-name'].toLowerCase()
          const lowerB = b['app-name'].toLowerCase()
          if (lowerA === lowerB) return 0
          else return lowerA > lowerB ? 1 : -1
        })

      const activeApps = []
      const deletedApps = []

      for (let i = 0; i < apps.length; i++) {
        const app = apps[i]

        if (app['deleted']) deletedApps.push(app)
        else activeApps.push(app)
      }

      if (this._isMounted) this.setState({ activeApps, deletedApps, loading: false })
    } catch (e) {
      if (this._isMounted) this.setState({ error: e.message, loading: false })
    }
  }

  componentWillUnmount() {
    this._isMounted = false
    document.removeEventListener('keydown', this.handleHitEnter, true)
  }

  handleHitEnter(e) {
    const ENTER_KEY_CODE = 13
    if ((e.target.name === 'appName') &&
      (e.key === 'Enter' || e.keyCode === ENTER_KEY_CODE)) {
      e.stopPropagation()
    }
  }

  async handleCreateApp(e) {
    e.preventDefault()
    const { appName, encryptionMode, activeApps, loadingApp } = this.state

    if (loadingApp) return

    try {
      this.setState({ loadingApp: true })

      const app = await adminLogic.createApp(appName, encryptionMode)

      let insertionIndex = activeApps.findIndex((activeApp) => (activeApp['app-name'].toLowerCase() > app['app-name'].toLowerCase()))
      if (insertionIndex === -1) {
        activeApps.push(app)
      } else {
        // insert into deleted users at insertion index
        activeApps.splice(insertionIndex, 0, app)
      }

      if (this._isMounted) this.setState({ activeApps, appName: '', error: '', loadingApp: false })
    } catch (err) {
      if (this._isMounted) this.setState({ error: err.message, loadingApp: false })
    }
  }

  handleInputChange(event) {
    if (this.state.error) this.setState({ error: undefined })

    const target = event.target
    const value = target.value
    const name = target.name

    this.setState({
      [name]: value
    })
  }

  handleShowDeletedApps(e) {
    e.preventDefault()
    this.setState({ showDeletedApps: true })
  }

  handleHideDeletedApps(e) {
    e.preventDefault()
    this.setState({ showDeletedApps: false })
  }

  async handlePermanentDeleteApp(app) {
    const { deletedApps } = this.state

    const appId = app['app-id']
    const appName = app['app-name']

    const getAppIndex = () => this.state.deletedApps.findIndex((app) => app['app-id'] === appId)

    try {
      if (window.confirm(`Are you sure you want to permanently delete app '${appName}'? There is no guarantee the app can be recovered after this.`)) {

        deletedApps[getAppIndex()].permanentDeleting = true
        this.setState({ deletedApps })

        await dashboardLogic.permanentDeleteApp(appId, appName)

        if (this._isMounted) {
          const { deletedApps } = this.state
          const appIndex = getAppIndex()
          deletedApps.splice(appIndex, 1)
          this.setState({ deletedApps })
        }
      }
    } catch (e) {
      if (this._isMounted) {
        const { deletedApps } = this.state
        deletedApps[getAppIndex()].permanentDeleting = undefined
        this.setState({ error: e.message, deletedApps })
      }
    }
  }

  handleSetEncryptionMode(encryptionMode) {
    this.setState({ encryptionMode })
  }

  handleShowEncryptionModeModal() {
    this.setState({ showEncryptionModeModal: true })
  }

  handleHideEncryptionModeModal() {
    this.setState({ showEncryptionModeModal: false })
  }

  render() {
    const { admin } = this.props
    const { size, sizeAllowed } = admin
    const { loading, activeApps, deletedApps, showDeletedApps, error, appName, encryptionMode, showEncryptionModeModal, loadingApp } = this.state

    return (
      <div className='text-xs sm:text-sm'>
        {
          loading
            ? <div className='text-center'><div className='loader w-6 h-6 inline-block mt-4' /></div>
            :

            <div className='container content text-center'>

              <div className='flex-0 mb-4 text-left'>
                <span>
                  <span className='text-lg sm:text-xl'>Apps</span>
                  {activeApps && activeApps.length > 0 &&
                    <span className='font-light text-md ml-2'>
                      ({activeApps.length} total)
                    </span>
                  }
                </span>
              </div>

              {showEncryptionModeModal && <EncryptionModeModal handleHideEncryptionModeModal={this.handleHideEncryptionModeModal} />}

              {
                (!adminLogic.saasSubscriptionNotActive(admin)) ? <div />
                  : <div className='text-left mb-4 text-orange-600 font-normal'>
                    The Starter plan is limited to 1 app and {FREE_PLAN_USERS_LIMIT} users. <a href="#edit-account">Remove this limit</a> with a Userbase subscription.
                </div>
              }

              {
                (sizeAllowed && size > sizeAllowed)
                  ? <div className='text-left mb-4 text-red-600 font-normal'>
                    You have exceeded your storage limit of {formatSize(sizeAllowed, false)}. Please <a href="#edit-account">upgrade your storage plan</a>.
                  </div>
                  : <div />
              }

              {activeApps && activeApps.length > 0 &&
                <table className='table-auto w-full border-none mx-auto text-xs'>

                  <thead>
                    <tr className='border-b'>
                      <th className='px-1 py-1 text-gray-800 text-left'>App</th>
                      <th className='px-1 py-1 text-gray-800 text-left'>App ID</th>
                      <th className='px-1 py-1 text-gray-800 text-left'>Data Stored (updated every 24hr)</th>
                    </tr>
                  </thead>

                  <tbody>

                    {activeApps.map((app) => (
                      <tr key={app['app-id']} className='border-b mouse:hover:bg-yellow-200 h-8'>
                        <td className='px-1 font-light text-left'>
                          <a href={`#app=${app['app-name']}`}>{app['app-name']}</a>
                        </td>
                        <td className='px-1 font-mono font-light text-left'>{app['app-id']}</td>
                        <td className='px-1 font-light text-left'>{formatSize(app['size'])}</td>
                      </tr>
                    ))}

                  </tbody>

                </table>
              }

              {!adminLogic.saasSubscriptionNotActive(admin) &&

                <form className={`flex text-left ${(activeApps && activeApps.length) ? 'mt-8' : ''}`}>
                  <div className='flex-1 my-auto'>
                    <input
                      className='input-text text-xs sm:text-sm w-36 xs:w-48'
                      type='text'
                      name='appName'
                      autoComplete='off'
                      value={appName}
                      placeholder='App name'
                      onChange={this.handleInputChange}
                    />
                  </div>

                  <div className='flex-3 my-auto ml-6 mr-2 text-left'>
                    <span className='inline-block mr-3 align-top'>
                      <div className='font-semibold text-sm'>Encryption Mode</div>
                      <a className='font-light italic underline text-xs cursor-pointer select-none' onClick={this.handleShowEncryptionModeModal}>What&apos;s this?</a>
                    </span>
                    <span className='inline-block'>
                      <div>
                        <input className='align-middle mb-1 mr-2 cursor-pointer' type='radio'
                          checked={encryptionMode === 'end-to-end'}
                          onChange={() => this.handleSetEncryptionMode('end-to-end')}
                        />
                        <label className='font-light cursor-pointer'
                          onClick={() => this.handleSetEncryptionMode('end-to-end')}
                        >End-to-end</label>
                      </div>
                      <div>
                        <input className='align-middle mb-1 mr-2 cursor-pointer' type='radio'
                          checked={encryptionMode === 'server-side'}
                          onChange={() => this.handleSetEncryptionMode('server-side')}
                        />
                        <label className='font-light cursor-pointer'
                          onClick={() => this.handleSetEncryptionMode('server-side')}
                        >Server-side</label>
                      </div>
                    </span>
                  </div>

                  <div className='flex-1 my-auto text-center'>
                    <input
                      className='btn'
                      type='submit'
                      value='Add'
                      disabled={!appName || loadingApp}
                      onClick={this.handleCreateApp}
                    />
                  </div>

                  <div className='flex-1 my-auto'>
                    {loadingApp && <div className='loader w-6 h-6' />}
                  </div>
                </form>
              }

              {deletedApps && deletedApps.length > 0 &&

                <div>
                  <div className='mt-6 text-left'>
                    <a className='select-none italic font-light cursor-pointer' onClick={showDeletedApps ? this.handleHideDeletedApps : this.handleShowDeletedApps}>
                      {showDeletedApps ? 'Hide' : 'Show'} apps pending deletion
                   </a>
                  </div>

                  {showDeletedApps &&
                    <div className='text-center overflow-auto whitespace-no-wrap'>
                      <table className='mt-6 table-auto w-full border-none mx-auto text-xs'>

                        <thead>
                          <tr className='border-b'>
                            <th className='px-1 py-1 text-gray-800 text-left'>App</th>
                            <th className='px-1 py-1 text-gray-800 text-left'>App ID</th>
                            <th className='px-1 py-1 text-gray-800 text-left'>Data Stored (updated every 24hr)</th>
                            <th className='px-1 py-1 text-gray-800 w-8'></th>
                          </tr>
                        </thead>

                        <tbody>

                          {deletedApps.map((app) => (
                            <tr key={app['app-id']} className='border-b mouse:hover:bg-yellow-200 h-8'>
                              <td className='px-1 font-light text-left text-red-700'>{app['app-name']}</td>
                              <td className='px-1 font-mono font-light text-left'>{app['app-id']}</td>
                              <td className='px-1 font-light text-left'>{formatSize(app['size'])}</td>
                              <td className='px-1 font-light w-8 text-center'>

                                {app['permanentDeleting']
                                  ? <div className='loader w-4 h-4 inline-block' />
                                  : <div
                                    className='font-normal text-sm cursor-pointer text-yellow-700'
                                    onClick={() => this.handlePermanentDeleteApp(app)}
                                  >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                  </div>
                                }

                              </td>
                            </tr>
                          ))}

                        </tbody>

                      </table>
                    </div>
                  }

                </div>
              }

              {error &&
                <div className='text-left'>
                  {error === 'Unknown Error'
                    ? <UnknownError />
                    : <div className='error'>{error}</div>
                  }
                </div>
              }

            </div>
        }
      </div>
    )
  }
}

Dashboard.propTypes = {
  admin: object,
}
