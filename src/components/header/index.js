import { h, Component } from 'preact';
import { route } from 'preact-router';
import Toolbar from 'preact-material-components/Toolbar';
import Drawer from 'preact-material-components/Drawer';
import List from 'preact-material-components/List';
import Dialog from 'preact-material-components/Dialog';
import Switch from 'preact-material-components/Switch';
import Select from 'preact-material-components/Select';
import 'preact-material-components/Select/style.css';
import 'preact-material-components/List/style.css';
import 'preact-material-components/Menu/style.css';

import 'preact-material-components/Switch/style.css';
import 'preact-material-components/Dialog/style.css';
import 'preact-material-components/Drawer/style.css';
import 'preact-material-components/List/style.css';
import 'preact-material-components/Toolbar/style.css';
import style from './style';

export default class Header extends Component {
    closeDrawer(){
        this.drawer.MDComponent.open = false;
        this.state = {
            darkThemeEnabled: false
        };
    }
    renderToolbarSelect(label, setAction, selectedItemIndex, items) {
        if (selectedItemIndex !== null) {
            return  (
                <div class={style.selectWithLabelAbove}>
                    <div class={style.selectLabel}>{label}</div>
                    <Select
                        hintText={"Select an " + label}
                        selectedIndex={selectedItemIndex}
                        onChange={(e) => setAction(e.selectedIndex)}
                        style={{width:"300px"}}
                    >
                    {
                       items.map((item) => (<Select.Item>{item.name}</Select.Item>))
                    }
                    </Select>
                    </div>
            );
        } else {
            return false;
        }
    }
    render() {
        const {actions, context, searchResultsURL} = this.props;
        return (
            <div>
                <Toolbar className="toolbar">
                    <Toolbar.Row>
                        <Toolbar.Section align-start={true}>
                            <Toolbar.Icon menu={true} onClick={() => {
                                this.drawer.MDComponent.open = true;
                            }}>menu</Toolbar.Icon>
                            <Toolbar.Title>
                                Persoo Data Analytics
                            </Toolbar.Title>
                        </Toolbar.Section>

                        <Toolbar.Section>
                            {
                                [
                                    this.renderToolbarSelect("Account", actions.setAccountAction, context.accountIndex, context.accounts),
                                    this.renderToolbarSelect("Environment", actions.setEnvironmentAction, context.environmentIndex, context.environments),
                                    this.renderToolbarSelect("Table", actions.setTableAction, context.tableIndex, context.tables)
                                ]
                            }
                        </Toolbar.Section>

                        <Toolbar.Section align-end={true} onClick={()=>{
                                this.dialog.MDComponent.show();
                            }}>
                            <Toolbar.Icon>settings</Toolbar.Icon>
                        </Toolbar.Section>
                    </Toolbar.Row>
                </Toolbar>
                <Drawer.TemporaryDrawer ref={drawer=>{this.drawer = drawer;}} >
                    <Drawer.TemporaryDrawerContent>
                        <List>
                            <List.LinkItem onClick={()=>{route(searchResultsURL); this.closeDrawer();}}>
                                <List.ItemIcon>home</List.ItemIcon>List
                            </List.LinkItem>
                            <List.LinkItem onClick={()=>{route('/profile'); this.closeDrawer();}}>
                                <List.ItemIcon>account_circle</List.ItemIcon>Profile
                            </List.LinkItem>

                            <List.LinkItem onClick={()=>{document.location = "http://admin.persoo.cz"; this.closeDrawer();}}>
                                <List.ItemIcon>account_circle</List.ItemIcon>Administration
                            </List.LinkItem>
                        </List>
                    </Drawer.TemporaryDrawerContent>
                </Drawer.TemporaryDrawer>
                <Dialog ref={dialog=>{this.dialog=dialog;}}>
          <Dialog.Header>Settings</Dialog.Header>
          <Dialog.Body>
                        <div>
                            Enable dark theme <Switch onClick={()=>{
                                this.setState({
                                    darkThemeEnabled: !this.state.darkThemeEnabled
                                },() => {
                                    if(this.state.darkThemeEnabled) {
                                        document.body.classList.add('mdc-theme--dark');
                                    } else {
                                        document.body.classList.remove('mdc-theme--dark');
                                    }
                                });
                            }}/>
                        </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.FooterButton accept={true}>okay</Dialog.FooterButton>
          </Dialog.Footer>
        </Dialog>
            </div>
        );
    }
}
